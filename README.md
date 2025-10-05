# vue-component-meta v3.x Monorepo Bug Reproduction

This repository demonstrates a bug in `vue-component-meta` v3.x where `ComponentProps<T>` conditional type is not evaluated in pnpm monorepo setups, resulting in empty props arrays.

## The Issue

- **v2.2.12**: Works correctly in monorepos
- **v3.1.0**: Returns empty props array in pnpm workspaces (even with `vue-component-type-helpers` installed)

## Project Structure

```
vue-component-meta-repro/
├── pnpm-workspace.yaml
├── packages/
│   ├── components/          # Component library
│   │   ├── Button.vue       # Test component with defineProps + defineModel
│   │   ├── index.ts         # Barrel export
│   │   └── tsconfig.json
│   └── docs/                # Documentation generator
│       ├── extract.js       # Uses vue-component-meta to extract component metadata
│       └── package.json     # Depends on @repro/components via workspace:*
```

## Setup & Test

### Test with v2.2.12 (Working)

```bash
pnpm install
pnpm --filter @repro/docs add -D vue-component-meta@2.2.12
pnpm --filter @repro/docs test
```

### Test with v3.1.0 (Broken)

```bash
pnpm install
pnpm --filter @repro/docs add -D vue-component-meta@3.1.0 vue-component-type-helpers@3.1.0
pnpm --filter @repro/docs test
```

## Expected Output (v2.2.12)

```
Testing vue-component-meta in monorepo

Props found: 4
Events found: 1
Type: 1

Props:
  - label: string (required: true, default: undefined)
  - disabled: boolean (required: false, default: false)
  - size: "sm" | "md" | "lg" (required: false, default: "md")
  - modelValue: number (required: false, default: 0)

Events:
  - update:modelValue: [value: number]

✅ SUCCESS
```

## Actual Output (v3.1.0)

```
Testing vue-component-meta in monorepo

Props found: 0
Events found: 0
Type: NaN

❌ FAILED - No props extracted

This demonstrates the vue-component-meta v3.x bug in monorepo setups.
```

## Root Cause

The `ComponentProps<T>` conditional type from `vue-component-type-helpers` is not being evaluated by TypeScript's type checker API when used in a pnpm workspace/monorepo setup. The type stays as the literal string `"ComponentProps<T>"` instead of resolving to the actual props interface.

This issue does NOT occur in simple single-package projects, only in monorepo configurations.

## Related Context

- Storybook still uses vue-component-meta v2.0.0 (haven't upgraded to v3.x)
- This affects documentation generation tools that use the programmatic API
- The issue is specific to how v3.x uses conditional types for prop extraction
