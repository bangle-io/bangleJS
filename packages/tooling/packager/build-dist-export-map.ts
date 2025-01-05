import path from 'node:path';
import type { Package } from '@manypkg/tools';
import fs from 'fs-extra';
import { globby } from 'globby';
import set from 'lodash/set';
import { type ExportMapResult, sortObject } from './common';
import { formatPackageJson } from './format-package-json';

/**
 * Builds an export map by reading the actual contents of the dist directory.
 * This is useful when you want to generate exports based on what's actually built
 * rather than source files.
 */
export async function buildDistExportMap(
  distDir: string,
  pkg: Package,
  writeToPackageJson = false,
): Promise<ExportMapResult> {
  if (!fs.existsSync(distDir)) {
    throw new Error(`Dist directory ${distDir} does not exist`);
  }

  const isTypes = (file: string) => file.endsWith('.d.ts');
  const isImport = (file: string) => file.endsWith('.js');
  const isRequire = (file: string) => file.endsWith('.cjs');
  const shouldIgnore = (file: string) => {
    const basename = path.basename(file);
    return basename.startsWith('.') || basename.startsWith('chunk-');
  };

  const files = await globby(['**/*.{js,mjs,cjs,d.ts}'], {
    cwd: distDir,
    absolute: false,
  });

  const filteredFiles = files.filter((file) => !shouldIgnore(file));

  if (!filteredFiles.some((file) => file === 'index.js')) {
    throw new Error(`No top level index file found in ${distDir}`);
  }

  if (!filteredFiles.some((file) => file.includes('index.d.ts'))) {
    throw new Error(
      `No top level index.d.ts file found in ${distDir} did you forget to build?`,
    );
  }

  let exportMap: Record<string, any> = {
    './package.json': './package.json',
  };

  const dirName = path.basename(distDir);

  // Process each file and map it to the appropriate export path
  filteredFiles.forEach((filePath) => {
    const parsed = path.parse(filePath);
    const dir = parsed.dir;
    const nameWithoutExt = (parsed.name + parsed.ext).replace(
      /\.(d\.)?(ts|js|mjs|cjs)$/,
      '',
    );
    const entryPoint = dir ? path.join(dir, nameWithoutExt) : nameWithoutExt;

    const exportKey = entryPoint === 'index' ? '.' : `./${entryPoint}`;

    if (isTypes(filePath)) {
      set(exportMap, [exportKey, 'types'], `./${dirName}/${filePath}`);
    } else if (isImport(filePath)) {
      set(exportMap, [exportKey, 'import'], `./${dirName}/${filePath}`);
    } else if (isRequire(filePath)) {
      set(exportMap, [exportKey, 'require'], `./${dirName}/${filePath}`);
    }
  });

  exportMap = sortObject(exportMap, (a, b) => {
    if (a === '.') return -1;
    if (b === '.') return 1;
    return a.localeCompare(b);
  });

  const result = {
    main: `./${dirName}/index.js`,
    module: `./${dirName}/index.mjs`,
    types: `./${dirName}/index.d.ts`,
    exports: exportMap,
  };

  if (writeToPackageJson) {
    await fs.writeJSON(
      path.join(pkg.dir, 'package.json'),
      formatPackageJson({
        ...pkg.packageJson,
        ...result,
      }),
      {
        spaces: 2,
      },
    );
  }

  return result;
}
