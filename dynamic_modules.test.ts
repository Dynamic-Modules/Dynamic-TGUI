import { describe, expect, test } from 'bun:test';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { loadDynamicModuleTguiFiles } from './dynamic_modules';

describe('dynamic module tgui discovery', () => {
	test('loads tgui manifest files from the generated Dynamic Modules index', () => {
		const hostRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dynamic-tgui-'));
		const moduleRoot = path.join(hostRoot, 'dynamic_modules/installed/example');
		const tguiFile = path.join(moduleRoot, 'tgui/panel.tgui.ts');
		const indexPath = path.join(hostRoot, '.dynamic_modules_build/index.json');

		fs.mkdirSync(path.dirname(tguiFile), { recursive: true });
		fs.mkdirSync(path.dirname(indexPath), { recursive: true });
		fs.writeFileSync(tguiFile, 'export const modularTgui = true;\n');
		fs.writeFileSync(
			indexPath,
			JSON.stringify({
				load_order: ['dynamic-tgui', 'example'],
				modules: {
					'dynamic-tgui': {
						root: 'dynamic_modules/installed/dynamic-tgui',
						tgui_files: [],
					},
					example: {
						root: 'dynamic_modules/installed/example',
						tgui_files: [
							'dynamic_modules/installed/example/tgui/panel.tgui.ts',
						],
					},
				},
			}),
		);

		expect(loadDynamicModuleTguiFiles({
			hostRoot,
			indexPath,
			moduleRoot: path.join(hostRoot, 'dynamic_modules/installed/dynamic-tgui'),
			tguiRoot: path.join(hostRoot, 'tgui'),
		})).toEqual([tguiFile]);
	});
});
