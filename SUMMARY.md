# Summary: vue-component-meta v3.x Monorepo Bug & Fix

## The Bug

**vue-component-meta v3.1.0 fails to extract component metadata in pnpm monorepos**, returning:
- 0 props (expected: 4+)
- 0 events (expected: 1+)
- Type: NaN (expected: 1)

Same setup works perfectly with v2.2.12.

## Root Cause

v3.x generates a `.meta.ts` file that imports type helpers from an external module:

```typescript
import type { ComponentProps, ... } from 'vue-component-meta/lib/helpers';
```

In monorepo setups, TypeScript's type checker API fails to evaluate these external conditional types, leaving them as literal `"ComponentProps<T>"` instead of resolving to actual prop interfaces.

## The Fix ✅

**Inline the type helper definitions** in the generated `.meta.ts` file instead of importing them.

### Changes Required

File: `node_modules/vue-component-meta/lib/base.js`

**Before (v3.1.0 - Broken):**
```javascript
function getMetaScriptContent(fileName) {
    let code = `
import type { ComponentType, ComponentProps, ComponentEmit, ComponentSlots, ComponentExposed } from 'vue-component-meta/lib/helpers';
import type * as Components from '${fileName.slice(0, -'.meta.ts'.length)}';
// ... rest
`.trim();
}
```

**After (Fixed):**
```javascript
function getMetaScriptContent(fileName) {
    let code = `
import type * as Components from '${fileName.slice(0, -'.meta.ts'.length)}';

export default {} as { [K in keyof typeof Components]: ComponentMeta<typeof Components[K]>; };

interface ComponentMeta<T> {
	type: ComponentType<T>;
	props: ComponentProps<T>;
	emit: ComponentEmit<T>;
	slots: ComponentSlots<T>;
	exposed: ComponentExposed<T>;
}

// Inline type helpers (no external import)
type ComponentType<T> = T extends new (...args: any) => {} ? 1 : T extends (...args: any) => any ? 2 : 0;
type ComponentProps<T> = T extends new (...args: any) => { $props: infer P; } ? NonNullable<P> : T extends (props: infer P, ...args: any) => any ? P : {};
type ComponentSlots<T> = T extends new (...args: any) => { $slots: infer S; } ? NonNullable<S> : T extends new (...args: any) => { $scopedSlots: infer S; } ? NonNullable<S> : T extends (props: any, ctx: { slots: infer S; attrs: any; emit: any; }, ...args: any) => any ? NonNullable<S> : {};
type ComponentEmit<T> = T extends new (...args: any) => { $emit: infer E; } ? NonNullable<E> : T extends (props: any, ctx: { slots: any; attrs: any; emit: infer E; }, ...args: any) => any ? NonNullable<E> : {};
type ComponentExposed<T> = T extends new (...args: any) => infer E ? E : T extends (props: any, ctx: any, expose: (exposed: infer E) => any, ...args: any) => any ? NonNullable<E> : {};
`.trim();
}
```

See `PATCH_FIX.diff` for the exact patch.

## Test Results

### Before Fix (v3.1.0)
```
Props found: 0
Events found: 0
Type: NaN
❌ FAILED
```

### After Fix (v3.1.0 + patch)
```
Props found: 10
Events found: 1
Type: 1
✅ SUCCESS
```

## Why This Works

1. **No module resolution needed**: Type helpers are defined inline, avoiding external module resolution issues
2. **TypeScript evaluates inline types reliably**: Conditional types in the same file are evaluated correctly by the type checker API
3. **Proven approach**: v2.x used inline type helpers successfully
4. **No breaking changes**: This is an internal implementation detail

## Benefits

- ✅ Fixes monorepo setups
- ✅ Maintains backward compatibility
- ✅ Simpler - no separate `vue-component-type-helpers` dependency needed
- ✅ More reliable across different project configurations

## Files in This Repository

- `README.md` - Setup instructions and technical analysis
- `PROPOSED_FIX.md` - Detailed explanation of the fix
- `PATCH_FIX.diff` - Exact patch to apply
- `ISSUE.md` - Template for GitHub issue
- `SUMMARY.md` - This file
- `packages/` - Minimal reproduction monorepo

## Next Steps

1. Push this repository to GitHub
2. Create issue in vuejs/language-tools with link to this repo
3. Propose the patch as a PR
4. Until merged: Use v2.2.12 or apply patch locally

## Credit

This fix restores the approach used in v2.x which embedded type helpers directly instead of importing them from an external module.
