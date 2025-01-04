/**
 * @type {import('tsup').Options}
 */
export const baseConfig = {
  format: ['esm', 'cjs'],
  entry: ['src/index.ts'],
  splitting: false,
  dts: true,
  clean: true,
  shims: false,
};
