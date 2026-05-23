import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { getDynamicTguiPaths } from './paths';
import { config } from './rspack.config-dev';

const reloadOnce = process.argv.includes('--reload');
const { tguiRoot } = getDynamicTguiPaths();

const devServerRoot = path.join(tguiRoot, 'packages/tgui-dev-server');
const [
	{ broadcastMessage, setupLink },
	{ loadSourceMaps },
	{ createLogger },
	{ reloadByondCache },
	{ resolveGlob },
] = await Promise.all([
	importFromDevServer('link/server'),
	importFromDevServer('link/retrace'),
	importFromDevServer('logging.ts'),
	importFromDevServer('reloader.ts'),
	importFromDevServer('util.ts'),
]);

const logger = createLogger('rspack');

class ModularRspackCompiler {
	rspack: any;
	bundleDir = '';

	async setup() {
		const requireFromTgui = createRequire(`${tguiRoot}/`);
		this.rspack = await requireFromTgui('@rspack/core');
		this.bundleDir = config.output?.path || '';
	}

	async watch() {
		logger.log('setting up');
		setupLink();

		const compiler = this.rspack.rspack(config);

		compiler.hooks.watchRun.tapPromise('tgui-dev-server', async () => {
			const files = await resolveGlob(this.bundleDir, '*.hot-update.*');
			for (const file of files) {
				await Bun.file(file).delete();
			}
			logger.log('compiling');
		});

		compiler.hooks.done.tap('tgui-dev-server', async () => {
			await loadSourceMaps(this.bundleDir);
			await reloadByondCache(this.bundleDir);
			broadcastMessage({
				type: 'hotUpdate',
			});
		});

		logger.log('watching for changes');
		compiler.watch({}, (err, stats) => {
			if (err) {
				logger.error('compilation error', err);
				return;
			}
			stats
				?.toString(config.stats)
				.split('\n')
				.forEach((line) => {
					logger.log(line);
				});
		});
	}
}

async function setupServer() {
	fs.mkdirSync(path.join(tguiRoot, 'public/.tmp'), { recursive: true });

	const compiler = new ModularRspackCompiler();
	await compiler.setup();

	if (reloadOnce) {
		await reloadByondCache(compiler.bundleDir);
		return;
	}

	await compiler.watch();
}

function importFromDevServer(relativePath: string) {
	const filePath = relativePath.endsWith('.ts') ?
		relativePath :
		`${relativePath}.ts`;
	return import(pathToFileURL(path.join(devServerRoot, filePath)).href);
}

setupServer();
