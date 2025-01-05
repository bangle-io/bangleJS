import { defineConfig } from 'vitest/config';

export default defineConfig((_env) => {
  return {
    test: {
      globals: true,
      setupFiles: 'vitest-global-setup.js',
      include: ['**/*.{vitest,spec}.?(c|m)[jt]s?(x)'],
      clearMocks: true,
      restoreMocks: true,
    },
    define: {},
  };
});
