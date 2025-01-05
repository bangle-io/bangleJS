import { tsImport } from 'tsx/esm/api';

/**
 * @type {import('tsup').Options}
 */
export const baseConfig = {
  format: ['esm', 'cjs'],
  splitting: true,
  dts: true,
  clean: true,
  shims: false,
};

export const getPackager = async () => {
  return (await tsImport('@bangle.dev/packager', import.meta.url))
}