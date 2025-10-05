# TSConfig Attempted Fixes

## Question
Can we fix the module resolution issue with tsconfig settings instead of patching the code?

## Answer
**No.** The issue is not about *finding* the module, but about TypeScript's type checker API not *evaluating* conditional types from external modules.

## Attempted Fixes

### 1. Change moduleResolution to "node"
```json
{
  "compilerOptions": {
    "moduleResolution": "node"
  }
}
```
**Result**: ❌ Still fails - 0 props extracted

### 2. Add preserveSymlinks
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "preserveSymlinks": true
  }
}
```
**Result**: ❌ Still fails - 0 props extracted

### 3. Explicit Path Mapping
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "vue-component-meta/lib/helpers": ["../../node_modules/vue-component-type-helpers/index.d.ts"]
    }
  }
}
```
**Result**: ❌ Still fails - 0 props extracted

### 4. Disable skipLibCheck
```json
{
  "compilerOptions": {
    "skipLibCheck": false
  }
}
```
**Result**: ❌ Still fails - 0 props extracted

## Why TSConfig Can't Fix This

The problem is in how TypeScript's Compiler API works, not in module resolution:

1. **Module IS resolved correctly** - TypeScript finds `vue-component-meta/lib/helpers` just fine
2. **Type IS imported** - The `ComponentProps<T>` type alias is available
3. **Problem**: When calling `typeChecker.getTypeOfSymbolAtLocation($props, symbolNode).getProperties()`, TypeScript returns the **unevaluated type alias** `ComponentProps<T>` instead of **evaluating the conditional type** to extract the actual props

This is a limitation of the TypeScript Compiler API when dealing with conditional type aliases from external modules, particularly in complex setups like monorepos.

## Evidence

Even with all tsconfig changes, the output remains:
```
Props found: 0
Events found: 0
Type: NaN
```

The type checker sees `ComponentProps<T>` but doesn't expand it to get the underlying interface.

## Conclusion

**There is no tsconfig fix.** The only solution is to inline the type helpers directly in the generated `.meta.ts` file, which forces TypeScript to evaluate them in the same context rather than treating them as external type aliases.

See `PROPOSED_FIX.md` and `PATCH_FIX.diff` for the working solution.
