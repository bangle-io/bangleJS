import { Options } from 'tsup';

export const baseConfig: Options;

export const getPackager: () => Promise<typeof import('@bangle.dev/packager')>;