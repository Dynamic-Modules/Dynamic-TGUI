import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { getDynamicTguiPaths } from './paths';
import { createModularTguiPlugins } from './plugin';

const { tguiRoot } = getDynamicTguiPaths();
const baseConfig = (await import(
	pathToFileURL(path.join(tguiRoot, 'rspack.config-dev.ts')).href
)).config;

export const config = {
	...baseConfig,
	plugins: [
		...createModularTguiPlugins(tguiRoot),
		...(baseConfig.plugins ?? []),
	],
};

export default config;
