import { defineConfig } from 'tsup';
import { baseConfig } from 'tsup-config';

const pkgJson = require('./package.json');
const tsupEntry = pkgJson.bangleConfig.tsupEntry;

export default defineConfig({
  ...baseConfig,
  entry: tsupEntry,
});
