import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { getDynamicTguiPaths } from './paths';
import { createModularTguiPlugins } from './plugin';

const { tguiRoot } = getDynamicTguiPaths();
const baseConfig = (await import(
	pathToFileURL(path.join(tguiRoot, 'rspack.config.ts')).href
)).default;

export default {
	...baseConfig,
	plugins: [
		...createModularTguiPlugins(tguiRoot),
		...(baseConfig.plugins ?? []),
	],
};
