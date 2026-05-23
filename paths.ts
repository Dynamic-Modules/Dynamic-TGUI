import fs from 'node:fs';
import path from 'node:path';

export type DynamicTguiPaths = {
	hostRoot: string;
	indexPath: string;
	moduleRoot: string;
	tguiRoot: string;
};

export function getDynamicTguiPaths(): DynamicTguiPaths {
	const moduleRoot = path.resolve(import.meta.dirname);
	const hostRoot = resolveHostRoot(moduleRoot);
	const tguiRoot = path.resolve(
		process.env.DYNAMIC_TGUI_ROOT || path.join(hostRoot, 'tgui'),
	);
	const indexPath = path.resolve(
		process.env.DYNAMIC_MODULES_INDEX ||
			path.join(hostRoot, '.dynamic_modules_build/index.json'),
	);

	return {
		hostRoot,
		indexPath,
		moduleRoot,
		tguiRoot,
	};
}

function resolveHostRoot(moduleRoot: string) {
	const configured = process.env.DYNAMIC_MODULES_HOST_ROOT;
	if (configured) {
		return path.resolve(configured);
	}

	const fromCwd = findUpward(process.cwd(), 'dynamic_modules.toml');
	if (fromCwd) {
		return fromCwd;
	}

	const fromModule = findUpward(moduleRoot, 'dynamic_modules.toml');
	if (fromModule) {
		return fromModule;
	}

	const installedRoot = path.resolve(moduleRoot, '../../..');
	if (fs.existsSync(path.join(installedRoot, 'tgui'))) {
		return installedRoot;
	}

	return process.cwd();
}

function findUpward(start: string, marker: string) {
	let current = path.resolve(start);
	while (true) {
		if (fs.existsSync(path.join(current, marker))) {
			return current;
		}

		const parent = path.dirname(current);
		if (parent === current) {
			return undefined;
		}
		current = parent;
	}
}
