import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { getDynamicTguiPaths } from '../paths';

const [, , command, ...args] = Bun.argv;

switch (command) {
	case 'analyze':
		run(rspackCommand(['--analyze', '--config', pathFromCli('../rspack.config.ts')]));
		break;
	case 'build':
		run(rspackCommand(['build', '--config', pathFromCli('../rspack.config.ts')]));
		break;
	case 'compare':
		runTool('../compare.ts', args);
		break;
	case 'create-override':
		runTool('./create_override.ts', args);
		break;
	case 'dev':
		run(['bun', '--smol', pathFromCli('../dev_server.ts'), ...args]);
		break;
	case 'generate-final':
		runTool('./generate_final.ts', args);
		break;
	case 'migrate-overrides':
		runTool('./migrate_modified.ts', args);
		break;
	case 'test':
		run(['bun', 'test', pathFromCli('../')]);
		break;
	default:
		console.error(
			[
				'Usage: bun run tgui:modular-tool -- <command> [options]',
				'',
				'Commands:',
				'  analyze',
				'  build',
				'  compare',
				'  create-override',
				'  dev',
				'  generate-final',
				'  migrate-overrides',
				'  test',
			].join('\n'),
		);
		process.exit(1);
}

function runTool(relativePath: string, args: string[]) {
	run(['bun', pathFromCli(relativePath), ...args]);
}

function run(cmd: string[]) {
	const result = Bun.spawnSync({
		cmd,
		stderr: 'inherit',
		stdout: 'inherit',
	});

	process.exit(result.exitCode);
}

function pathFromCli(relativePath: string) {
	return fileURLToPath(new URL(relativePath, import.meta.url));
}

function rspackCommand(args: string[]) {
	const rspack = rspackBin();
	if (path.isAbsolute(rspack)) {
		return ['bun', rspack, ...args];
	}

	return [rspack, ...args];
}

function rspackBin() {
	const { tguiRoot } = getDynamicTguiPaths();
	const cliScript = path.join(tguiRoot, 'node_modules', '@rspack', 'cli', 'bin', 'rspack.js');
	if (fs.existsSync(cliScript)) {
		return cliScript;
	}

	const binaryName = process.platform === 'win32' ? 'rspack.cmd' : 'rspack';
	const localBin = path.join(tguiRoot, 'node_modules', '.bin', binaryName);

	if (fs.existsSync(localBin)) {
		return localBin;
	}

	return 'rspack';
}
