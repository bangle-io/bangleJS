import path from 'node:path';
import { defineConfig } from 'tsup';
import { baseConfig, getPackager } from 'tsup-config';
export default defineConfig(async () => {
  const pkgJson = require('./package.json');
  const name = pkgJson.name;
  const { Packager, buildExportMap } = await getPackager();
  const packager = await new Packager({}).init();
  const entry = await packager.generateTsupEntry(name);

  console.log(await buildExportMap(path.join(import.meta.dirname, 'dist')));

  return {
    ...baseConfig,
    entry: entry,
  };
});
