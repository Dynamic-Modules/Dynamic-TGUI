# Dynamic TGUI

Dynamic TGUI lets Dynamic SS13 Modules patch or replace tgstation-style `tgui/`
source during the normal tgui build without committing generated tgui edits to
the host repository.

## Host Build Hook

The host repo should run Dynamic SS13 Modules `prepare` before tgui builds. In
TGS this belongs in `tools/tgs_scripts/PreCompile.sh` before
`tools/build/build.ts`; local builds should use the same prepare wrapper.

When the `dynamic-tgui` module is installed, its prepare plugin generates:

```text
.dynamic_modules_build/tgui/cli.ts
```

Point the host `tgui/package.json` scripts at that generated wrapper:

```json
{
  "scripts": {
    "tgui:analyze": "bun ../.dynamic_modules_build/tgui/cli.ts analyze",
    "tgui:build": "bun ../.dynamic_modules_build/tgui/cli.ts build",
    "tgui:dev": "bun ../.dynamic_modules_build/tgui/cli.ts dev",
    "tgui:test": "bun test",
    "tgui:tsc": "tsc"
  }
}
```

The wrapper sets the host/index environment and dispatches to this module's
Rspack config. The framework only runs the generic prepare plugin API here;
Dynamic TGUI owns the wrapper path and generation details. If no modules
declare tgui overlays, the Rspack plugin returns no extra patches and the
normal tgui build proceeds.

## Module Manifests

Modules that need tgui changes should depend on Dynamic TGUI and declare their
tgui manifest files in their Dynamic SS13 module manifest:

```toml
[load]
requires = ["dynamic-tgui"]

[build]
tgui = ["tgui/**/*.tgui.ts"]
```

Each `*.tgui.ts`, `*.tgui.tsx`, `*.tgui.js`, or `*.tgui.jsx` file must opt in:

```ts
import { block, type ModularTguiPatch } from '../../dynamic-tgui';

export const modularTgui = true;

export const patches: ModularTguiPatch[] = [
  {
    target: 'packages/tgui/interfaces/PreferencesMenu/types.ts',
    operations: [
      {
        kind: 'ast-add-type-member',
        typeName: 'PreferencesMenuData',
        content: block`
          extra_panel_state: string;
        `,
      },
    ],
  },
];
```

Patch and override targets are relative to the host `tgui/` directory.

## Ordering

Dynamic TGUI loads module tgui manifests in Dynamic SS13 Modules load order. If
two modules touch the same target, earlier modules build the base overlay and
later modules compose on top. Use normal Dynamic Modules dependencies,
`load_after`, and `load_before` to make ordering explicit.

## Overrides

Use whole-file overrides when a tgui file is intentionally downstream-owned or a
small patch would be harder to maintain:

```ts
import type { ModularTguiOverride } from '../../dynamic-tgui';

export const modularTgui = true;

export const overrides: ModularTguiOverride[] = [
  {
    target: 'packages/tgui/interfaces/Example.tsx',
    replacement: 'overrides/Example.tsx',
  },
];
```

`replacement` is relative to the manifest file declaring the override.

## Useful Commands

Run from the host `tgui/` package after `dynamic-modules prepare`:

```bash
bun ../.dynamic_modules_build/tgui/cli.ts build
bun ../.dynamic_modules_build/tgui/cli.ts dev
bun ../.dynamic_modules_build/tgui/cli.ts test
bun ../.dynamic_modules_build/tgui/cli.ts generate-final \
  --target packages/tgui/interfaces/Example.tsx
```

`generate-final` prints the source after all matching overrides and patches have
been composed, which is useful when debugging module ordering.
