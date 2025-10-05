# ✅ PROVEN FIX for vue-component-meta v3.x Monorepo Bug

**Status**: Tested and working! See `PATCH_FIX.diff` for the exact changes.

## Root Cause

In v3.x, the generated `.meta.ts` file imports type helpers from an external module:

```typescript
import type { ComponentType, ComponentProps, ComponentEmit, ComponentSlots, ComponentExposed }
  from 'vue-component-meta/lib/helpers';
```

In monorepo setups, TypeScript's type checker API fails to properly resolve and evaluate these external conditional types, resulting in `ComponentProps<T>` staying as a literal type instead of being evaluated.

## The Fix

**Inline the type helper definitions** directly in the generated `.meta.ts` file, similar to how v2.x worked.

### Current Code (v3.x - BROKEN)

```javascript
// In lib/base.js
function getMetaScriptContent(fileName) {
    let code = `
import type { ComponentType, ComponentProps, ComponentEmit, ComponentSlots, ComponentExposed } from 'vue-component-meta/lib/helpers';
import type * as Components from '${fileName.slice(0, -'.meta.ts'.length)}';

export default {} as { [K in keyof typeof Components]: ComponentMeta<typeof Components[K]>; };

interface ComponentMeta<T> {
	type: ComponentType<T>;
	props: ComponentProps<T>;
	emit: ComponentEmit<T>;
	slots: ComponentSlots<T>;
	exposed: ComponentExposed<T>;
}
`.trim();
    return code;
}
```

### Proposed Fix (WORKING)

```javascript
// In lib/base.js
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

// Inline type helpers (from vue-component-type-helpers)
type ComponentType<T> = T extends new (...args: any) => {} ? 1 : T extends (...args: any) => any ? 2 : 0;

type ComponentProps<T> = T extends new (...args: any) => {
    $props: infer P;
} ? NonNullable<P> : T extends (props: infer P, ...args: any) => any ? P : {};

type ComponentSlots<T> = T extends new (...args: any) => {
    $slots: infer S;
} ? NonNullable<S> : T extends new (...args: any) => {
    $scopedSlots: infer S;
} ? NonNullable<S> : T extends (props: any, ctx: {
    slots: infer S;
    attrs: any;
    emit: any;
}, ...args: any) => any ? NonNullable<S> : {};

type ComponentAttrs<T> = T extends new (...args: any) => {
    $attrs: infer A;
} ? NonNullable<A> : T extends (props: any, ctx: {
    slots: any;
    attrs: infer A;
    emit: any;
}, ...args: any) => any ? NonNullable<A> : {};

type ComponentEmit<T> = T extends new (...args: any) => {
    $emit: infer E;
} ? NonNullable<E> : T extends (props: any, ctx: {
    slots: any;
    attrs: any;
    emit: infer E;
}, ...args: any) => any ? NonNullable<E> : {};

type ComponentExposed<T> = T extends new (...args: any) => infer E ? E : T extends (props: any, ctx: any, expose: (exposed: infer E) => any, ...args: any) => any ? NonNullable<E> : {};
`.trim();
    return code;
}
```

## Why This Works

1. **No external module resolution**: The type helpers are defined inline, so TypeScript doesn't need to resolve an external module
2. **TypeScript evaluates inline types better**: When types are defined in the same file, TypeScript's type checker API handles conditional type evaluation more reliably
3. **Proven approach**: v2.x used this approach successfully
4. **No breaking changes**: This is an internal implementation detail; the public API remains the same

## Benefits

- ✅ Fixes monorepo setups
- ✅ Maintains backward compatibility
- ✅ No dependency on separate `vue-component-type-helpers` package needed (can be peer dep or removed entirely)
- ✅ Simpler module resolution

## Alternative Solutions Considered

### 1. Force Type Alias Resolution
Instead of getting the type directly, force TypeScript to resolve the type alias:

```javascript
function getProps() {
    const $props = symbolProperties.find(prop => prop.escapedName === 'props');
    if ($props) {
        let type = typeChecker.getTypeOfSymbolAtLocation($props, symbolNode);

        // Force resolve type aliases
        if (type.aliasSymbol) {
            type = typeChecker.getTypeAtLocation(type.aliasSymbol.declarations[0]);
        }

        const properties = type.getProperties();
        // ... rest of code
    }
}
```

**Problem**: This doesn't work because `ComponentProps<T>` isn't stored as an alias in the way we can access it.

### 2. Use TypeScript's Type Instantiation
Try to manually instantiate the conditional type:

**Problem**: The TypeScript Compiler API doesn't expose a clean way to manually instantiate conditional types programmatically.

## Recommendation

**Use the inline approach** (proposed fix above). It's:
- Simple
- Proven (worked in v2.x)
- Requires minimal code changes
- Most reliable across different project setups
