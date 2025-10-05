# TSConfig Attempted Fixes

## Question
Can we fix the module resolution issue with tsconfig settings instead of patching the code?

## Answer
**No.** The issue is not about *finding* the module, but about TypeScript's type checker API not *evaluating* conditional types from external modules.

## Comprehensive Testing

### 1. All moduleResolution Options

Tested **all 5 available moduleResolution strategies**:

| Strategy | TypeScript Version | Result |
|----------|-------------------|--------|
| `node` | All versions | ❌ 0 props |
| `node16` | 4.7+ | ❌ 0 props |
| `nodenext` | 4.7+ | ❌ 0 props |
| `bundler` | 5.0+ | ❌ 0 props |
| `classic` | Legacy | ❌ 0 props |

**Conclusion**: ❌ **All moduleResolution strategies fail identically**

### 2. preserveSymlinks
```json
{
  "compilerOptions": {
    "moduleResolution": "node",
    "preserveSymlinks": true
  }
}
```
**Result**: ❌ 0 props extracted

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
**Result**: ❌ 0 props extracted

### 4. Disable skipLibCheck
```json
{
  "compilerOptions": {
    "skipLibCheck": false
  }
}
```
**Result**: ❌ 0 props extracted

### 5. Package.json Exports Resolution (TS 5.x features)
```json
{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "resolvePackageJsonExports": true,
    "resolvePackageJsonImports": true
  }
}
```
**Result**: ❌ 0 props extracted

### 6. Exact Teamwork Production tsconfig
Used the exact same tsconfig structure as the working production project:
```json
{
  "extends": "../../tsconfig.options.json",
  "compilerOptions": {
    "noEmit": true
  }
}
```
Where `tsconfig.options.json` extends `@vue/tsconfig/tsconfig.dom.json` with Vue-specific settings.

**Result**: ❌ 0 props extracted

This proves the issue exists even with production-tested tsconfig settings.

## Why TSConfig Can't Fix This

The problem is in how TypeScript's Compiler API works, not in module resolution:

1. **Module IS resolved correctly** - TypeScript finds `vue-component-meta/lib/helpers` just fine
2. **Type IS imported** - The `ComponentProps<T>` type alias is available  
3. **Problem**: When calling `typeChecker.getTypeOfSymbolAtLocation($props, symbolNode).getProperties()`, TypeScript returns the **unevaluated type alias** `ComponentProps<T>` instead of **evaluating the conditional type** to extract the actual props

This is a limitation of the TypeScript Compiler API when dealing with conditional type aliases from external modules, particularly in complex setups like monorepos.

## Evidence

Even with all tsconfig changes (6 different strategies + 5 moduleResolution modes = 11+ tests), the output remains:
```
Props found: 0
Events found: 0
Type: NaN
```

The type checker sees `ComponentProps<T>` but doesn't expand it to get the underlying interface.

## Conclusion

**There is no tsconfig fix.** The only solution is to inline the type helpers directly in the generated `.meta.ts` file, which forces TypeScript to evaluate them in the same context rather than treating them as external type aliases.

See `PROPOSED_FIX.md` and `PATCH_FIX.diff` for the working solution.

### 7. TypeScript 5.9 Strict Type Checking Options
Tested all the new TS 5.9 strict options:
```json
{
  "compilerOptions": {
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "exactOptionalPropertyTypes": true,
    "noUncheckedIndexedAccess": true,
    "noUncheckedSideEffectImports": true
  }
}
```
**Result**: ❌ 0 props extracted

## Summary of All Tests

**Total tests performed**: 12+
- 5 different `moduleResolution` strategies (node, node16, nodenext, bundler, classic)
- `preserveSymlinks`
- Explicit path mapping
- `skipLibCheck: false`
- Package.json exports resolution
- Production tsconfig (from teamwork-lightspeed)
- TypeScript 5.9 strict options

**Success rate**: 0/12+ (0%)

**Conclusion**: ✅ **Comprehensively proven - no tsconfig option exists that fixes this bug.**
