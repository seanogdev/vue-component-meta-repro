# Bug Report: vue-component-meta v3.x fails in pnpm monorepo

## Description

`vue-component-meta` v3.1.0 fails to extract component metadata (props, events, type) when used in a pnpm workspace/monorepo setup. The same code works perfectly with v2.2.12.

## Reproduction

Repository: `/Users/seanogrady/projects/teamwork/vue-component-meta-repro` (ready to push to GitHub)

### Steps to reproduce:

1. Clone the repository
2. Run `pnpm install`
3. Test with v2.2.12:
   ```bash
   pnpm --filter @repro/docs add -D vue-component-meta@2.2.12
   pnpm --filter @repro/docs test
   # ✅ SUCCESS: 4 props + 1 event extracted
   ```
4. Test with v3.1.0:
   ```bash
   pnpm --filter @repro/docs remove vue-component-meta
   pnpm --filter @repro/docs add -D vue-component-meta@3.1.0 vue-component-type-helpers@3.1.0
   pnpm --filter @repro/docs test
   # ❌ FAILED: 0 props, 0 events, Type: NaN
   ```

## Expected behavior

v3.1.0 should extract component metadata just like v2.2.12 does:

```
Props found: 4
Events found: 1
Type: 1

Props:
  - label: string (required: true)
  - disabled: boolean (required: false, default: false)
  - size: "sm" | "md" | "lg" (required: false, default: "md")
  - modelValue: number (required: false, default: 0)

Events:
  - update:modelValue: [value: number]
```

## Actual behavior (v3.1.0)

```
Props found: 0
Events found: 0
Type: NaN
```

## Environment

- vue-component-meta: 3.1.0
- vue-component-type-helpers: 3.1.0
- TypeScript: 5.9.3
- Vue: 3.5.22
- pnpm: 10.17.1
- Node: v24.9.0

## Root Cause Analysis

The `ComponentProps<T>` conditional type from `vue-component-type-helpers` is not being evaluated by TypeScript's type checker API in monorepo setups. The type stays as the literal string `"ComponentProps<T>"` instead of resolving to the actual props interface.

This issue does NOT occur in simple single-package projects, only in pnpm workspace/monorepo configurations.

## Additional Context

- Storybook (@storybook/vue3-vite) still uses vue-component-meta v2.0.0 and hasn't upgraded to v3.x
- This affects documentation generation tools that use the programmatic API
- Workaround: Use v2.2.12 instead of v3.x in monorepo setups
