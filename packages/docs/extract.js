import { createChecker } from 'vue-component-meta';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const componentsDir = resolve(__dirname, '../components');
const tsconfigPath = resolve(componentsDir, 'tsconfig.json');
const componentPath = resolve(componentsDir, 'Button.vue');

console.log('Testing vue-component-meta in monorepo\n');
console.log('Component path:', componentPath);
console.log('TSConfig path:', tsconfigPath);
console.log('');

const checker = createChecker(tsconfigPath, {
  forceUseTs: true,
  noDeclarations: true,
  printer: { newLine: 1 },
});

try {
  const exportNames = checker.getExportNames(componentPath);
  console.log('Export names:', exportNames);

  const meta = checker.getComponentMeta(componentPath, 'default');

  console.log('\nResults:');
  console.log('  Props found:', meta.props.length);
  console.log('  Events found:', meta.events.length);
  console.log('  Type:', meta.type);

  if (meta.props.length > 0) {
    console.log('\n  Props:');
    meta.props.filter(p => !p.global).forEach(prop => {
      console.log(`    - ${prop.name}: ${prop.type} (required: ${prop.required}, default: ${prop.default})`);
    });
  }

  if (meta.events.length > 0) {
    console.log('\n  Events:');
    meta.events.forEach(event => {
      console.log(`    - ${event.name}: ${event.type}`);
    });
  }

  const success = meta.props.filter(p => !p.global).length > 0;
  console.log('\n' + (success ? '✅ SUCCESS' : '❌ FAILED - No props extracted'));

  if (!success) {
    console.log('\nThis demonstrates the vue-component-meta v3.x bug in monorepo setups.');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
