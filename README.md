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

## Technical Analysis

### How vue-component-meta v3.x Works

1. Creates a virtual `.meta.ts` file for each component:
   ```typescript
   import type { ComponentType, ComponentProps, ComponentEmit, ComponentSlots, ComponentExposed }
     from 'vue-component-meta/lib/helpers';
   import type * as Components from './Button.vue';

   export default {} as { [K in keyof typeof Components]: ComponentMeta<typeof Components[K]>; };

   interface ComponentMeta<T> {
     type: ComponentType<T>;
     props: ComponentProps<T>;  // ← This conditional type is not being evaluated
     emit: ComponentEmit<T>;
     slots: ComponentSlots<T>;
     exposed: ComponentExposed<T>;
   }
   ```

2. The `ComponentProps<T>` helper type:
   ```typescript
   // From vue-component-type-helpers
   export type ComponentProps<T> = T extends new (...args: any) => {
       $props: infer P;
   } ? NonNullable<P> : T extends (props: infer P, ...args: any) => any ? P : {};
   ```

3. **The Bug**: In monorepo setups, TypeScript's type checker API returns the literal type `"ComponentProps<T>"` instead of evaluating the conditional type and extracting the actual props interface.

### Why v2.x Works

v2.x uses a different mechanism that directly extracts types from the TypeScript AST instead of relying on conditional type helpers. This approach works correctly in both single-package and monorepo setups.

### Version Comparison

- **v2.2.12**: ✅ Directly extracts types from TypeScript AST
- **v3.1.0**: ❌ Uses `vue-component-type-helpers` conditional types (breaks in monorepos)

## Impact

- **Storybook** still uses vue-component-meta v2.0.0 (haven't upgraded to v3.x)
- **Documentation generators** using the programmatic API are affected
- **Monorepo projects** cannot upgrade to v3.x
- **Workaround**: Stay on v2.2.12 until this is fixed

## Environment

- vue-component-meta: 3.1.0
- vue-component-type-helpers: 3.1.0
- TypeScript: 5.9.3
- Vue: 3.5.22
- pnpm: 10.17.1
- Node: v24.9.0
