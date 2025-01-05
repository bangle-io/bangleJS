import { defineConfig } from 'tsup';
import { baseConfig } from 'tsup-config';

const pkgJson = require('./package.json');
const tsupEntry = pkgJson.bangleConfig.tsupEntry;

if (!tsupEntry || Object.keys(tsupEntry).length === 0) {
  throw new Error('tsupEntry is not defined in package.json');
}

export default defineConfig({
  ...baseConfig,
  entry: tsupEntry,
});
