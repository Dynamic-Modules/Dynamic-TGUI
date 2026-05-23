import { createRequire } from 'node:module';
import path from 'node:path';

import { getDynamicTguiPaths } from './paths';
import { createModularTguiPlugins } from './plugin';

const { tguiRoot } = getDynamicTguiPaths();
const require = createRequire(import.meta.url);
const baseConfig = require(path.join(tguiRoot, 'rspack.config.ts')).default;

export default {
	...baseConfig,
	plugins: [
		...createModularTguiPlugins(tguiRoot),
		...(baseConfig.plugins ?? []),
	],
};
