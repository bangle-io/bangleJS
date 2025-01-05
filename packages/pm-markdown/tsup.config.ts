import { defineConfig } from 'tsup';
import { baseConfig, getPackager } from 'tsup-config';

export default defineConfig(async () => {
  const pkgJson = await import('./package.json');
  const name = pkgJson.default.name;
  const { Packager } = await getPackager();
  const packager = await new Packager({}).init();
  const entry = await packager.generateTsupEntry(name);
  return {
    ...baseConfig,
    entry: entry,
  };
});
