import fs from 'node:fs';
import path from 'node:path';

import type { DynamicTguiPaths } from './paths';

const MANIFEST_EXTENSIONS = ['.tgui.ts', '.tgui.tsx', '.tgui.js', '.tgui.jsx'];
const IGNORED_DIRECTORIES = new Set([
	'.cache',
	'.generated',
	'.git',
	'node_modules',
]);

export function loadDynamicModuleTguiFiles(paths: DynamicTguiPaths) {
	const fromIndex = loadManifestFilesFromIndex(paths);
	if (fromIndex.length > 0) {
		return fromIndex;
	}

	return scanModuleRootsFromIndex(paths);
}

function loadManifestFilesFromIndex(paths: DynamicTguiPaths) {
	const index = readIndex(paths.indexPath);
	if (!index) {
		return [];
	}

	const files: string[] = [];
	for (const moduleId of index.load_order ?? []) {
		const module = index.modules?.[moduleId];
		for (const filePath of module?.tgui_files ?? []) {
			files.push(resolveHostPath(paths.hostRoot, filePath));
		}
	}

	return existingFiles(files);
}

function scanModuleRootsFromIndex(paths: DynamicTguiPaths) {
	const index = readIndex(paths.indexPath);
	if (!index) {
		return [];
	}

	const files: string[] = [];
	for (const moduleId of index.load_order ?? []) {
		if (moduleId === 'dynamic-tgui') {
			continue;
		}

		const moduleRoot = index.modules?.[moduleId]?.root;
		if (!moduleRoot) {
			continue;
		}

		const tguiRoot = path.join(resolveHostPath(paths.hostRoot, moduleRoot), 'tgui');
		if (fs.existsSync(tguiRoot)) {
			files.push(...discoverManifestFiles(tguiRoot));
		}
	}

	return existingFiles(files);
}

function readIndex(indexPath: string): any | undefined {
	if (!fs.existsSync(indexPath)) {
		return undefined;
	}

	return JSON.parse(fs.readFileSync(indexPath, 'utf8'));
}

function resolveHostPath(hostRoot: string, filePath: string) {
	if (path.isAbsolute(filePath)) {
		return filePath;
	}

	return path.resolve(hostRoot, filePath);
}

function existingFiles(files: string[]) {
	return [...new Set(files.map((file) => path.resolve(file)))]
		.filter((file) => fs.existsSync(file) && fs.statSync(file).isFile());
}

function discoverManifestFiles(directoryPath: string) {
	const manifestFiles: string[] = [];
	const entries = fs
		.readdirSync(directoryPath, { withFileTypes: true })
		.sort((left, right) => left.name.localeCompare(right.name));

	for (const entry of entries) {
		const entryPath = path.join(directoryPath, entry.name);
		if (entry.isFile() && isManifestFile(entry.name)) {
			manifestFiles.push(entryPath);
		}
	}

	for (const entry of entries) {
		const entryPath = path.join(directoryPath, entry.name);
		if (entry.isDirectory() && !IGNORED_DIRECTORIES.has(entry.name)) {
			manifestFiles.push(...discoverManifestFiles(entryPath));
		}
	}

	return manifestFiles;
}

function isManifestFile(fileName: string) {
	return MANIFEST_EXTENSIONS.some((extension) => fileName.endsWith(extension));
}
