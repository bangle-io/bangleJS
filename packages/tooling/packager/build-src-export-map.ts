import path from 'node:path';
import type { Package } from '@manypkg/tools';
import fs from 'fs-extra';
import { globby } from 'globby';
import { type ExportMapResult, sortObject } from './common';
import { formatPackageJson } from './format-package-json';

/**
 * Builds an export map by reading the actual contents of the src directory.
 * This is useful when you want to generate exports based on source files
 * rather than built files.
 */
export async function buildSrcExportMap(
  srcDir: string,
  pkg: Package,
  writeToPackageJson = false,
): Promise<ExportMapResult> {
  if (!fs.existsSync(srcDir)) {
    throw new Error(`Source directory ${srcDir} does not exist`);
  }

  const isTopLevelItem = (filePath: string): boolean => {
    return (
      !filePath.includes('/') ||
      (filePath.split('/').length === 2 &&
        (filePath.endsWith('/index.ts') || filePath.endsWith('/index.tsx')))
    );
  };

  const files = await globby(['**/*.{ts,tsx}'], {
    cwd: srcDir,
    absolute: false,
    gitignore: true,
    ignore: [
      '.*',
      '**/__tests__/**',
      '**/*.test.{ts,tsx}',
      '**/*.spec.{ts,tsx}',
    ],
  });

  const filteredFiles = files
    .filter(isTopLevelItem)
    .sort((a, b) => a.localeCompare(b));

  if (
    !filteredFiles.some((file) => file === 'index.ts' || file === 'index.tsx')
  ) {
    throw new Error(`No top level index file found in ${srcDir}`);
  }

  const hasTopLevelIndex = filteredFiles.some(
    (file) => file === 'index.ts' || file === 'index.tsx',
  );

  let exportMap: Record<string, string> = {
    './package.json': './package.json',
  };

  // Process each file and map it to the appropriate export path
  filteredFiles.forEach((filePath) => {
    const parsedPath = path.parse(filePath);
    const key = parsedPath.dir || parsedPath.name;
    const exportKey = key === 'index' ? '.' : `./${key}`;
    exportMap[exportKey] = `./${path.join('src', filePath)}`;
  });

  exportMap = sortObject(exportMap, (a, b) => {
    if (a === '.') return -1;
    if (b === '.') return 1;
    return a.localeCompare(b);
  });

  const result = {
    main: hasTopLevelIndex ? './src/index.ts' : '',
    exports: exportMap,
  };

  if (writeToPackageJson) {
    const finalPackageJson = formatPackageJson({
      ...pkg.packageJson,
      ...result,
    });
    (finalPackageJson as any).module = undefined;
    (finalPackageJson as any).types = undefined;

    await fs.writeJSON(path.join(pkg.dir, 'package.json'), finalPackageJson, {
      spaces: 2,
    });
  }

  return result;
}
