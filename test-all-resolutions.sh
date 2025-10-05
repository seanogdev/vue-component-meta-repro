#!/bin/bash

resolutions=("node" "node16" "nodenext" "bundler" "classic")

for res in "${resolutions[@]}"; do
    echo ""
    echo "========================================="
    echo "Testing moduleResolution: $res"
    echo "========================================="
    
    cat > packages/components/tsconfig.json << JSON
{
  "extends": "../../tsconfig.options.json",
  "compilerOptions": {
    "noEmit": true,
    "moduleResolution": "$res"
  },
  "include": ["./**/*.vue", "./**/*.ts"],
  "exclude": ["**/dist", "**/node_modules"]
}
JSON
    
    pnpm --filter @repro/docs test 2>&1 | grep -A 3 "Results:"
done

# Restore original
cat > packages/components/tsconfig.json << 'JSON'
{
  "extends": "../../tsconfig.options.json",
  "compilerOptions": {
    "noEmit": true
  },
  "include": ["./**/*.vue", "./**/*.ts"],
  "exclude": ["**/dist", "**/node_modules"]
}
JSON
