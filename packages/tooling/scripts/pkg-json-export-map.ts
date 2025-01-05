import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa'; // retained so we don't break any potential usage
import { readJSONSync, writeJSONSync } from 'fs-extra';
import { globby } from 'globby';

// ------------------------------------------------------
// Top-level constants
// ------------------------------------------------------
const OUTPUT_DIR = 'dist';
const SRC_DIR = 'src';

const GLOBBY_PATTERNS = ['**/*.{ts,tsx}'];
const GLOBBY_IGNORES = [
  '**/__tests__/**',
  '**/*.{spec,test}.{ts,tsx}',
  '**/.*/**',
];

/**
 * The standard order of package.json fields.
 * Fields present in this array will be placed in the final
 * package.json in this exact order, followed by any other
 * fields not in the list.
 */
const STANDARD_FIELD_ORDER = [
  'name',
  'version',
  'authors',
  'author',
  'private',
  'description',
  'keywords',
  'homepage',
  'bugs',
  'license',
  'contributors',
  'repository',
  'type',
  'publishConfig',
  'main',
  'module',
  'types',
  'bin',
  'files',
  'scripts',
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
  'engines',
  'exports',
  'packageManager',
];

// ------------------------------------------------------
// Types
// ------------------------------------------------------
interface ExportMap {
  [key: string]: {
    types?: string;
    import?: string;
    require?: string;
  };
}

// ------------------------------------------------------
// Utility: format package.json fields in a standard order
// ------------------------------------------------------
function formatPackageJson(pkg: Record<string, any>): Record<string, any> {
  const formatted: Record<string, any> = {};

  // First add fields in the standard order
  for (const field of STANDARD_FIELD_ORDER) {
    if (field in pkg) {
      formatted[field] = pkg[field];
    }
  }

  // Then add any remaining fields
  for (const field in pkg) {
    if (!STANDARD_FIELD_ORDER.includes(field)) {
      formatted[field] = pkg[field];
    }
  }

  return formatted;
}

// ------------------------------------------------------
// Utility: find .ts / .tsx source files
// ------------------------------------------------------
async function findSourceFiles(srcDir: string): Promise<string[]> {
  return globby(GLOBBY_PATTERNS, {
    cwd: srcDir,
    ignore: GLOBBY_IGNORES,
    absolute: false,
  });
}

// ------------------------------------------------------
// Utility: check if a file is the top-level index.ts / index.tsx
// ------------------------------------------------------
function isTopLevelIndexFile(filePath: string): boolean {
  return filePath === 'index.ts' || filePath === 'index.tsx';
}

// ------------------------------------------------------
// Utility: check if a file is "top-level"
// ------------------------------------------------------
function isTopLevelFile(filePath: string): boolean {
  // Either no slash at all, or it might be something like "dir/index.ts(x)"
  return (
    !filePath.includes('/') ||
    (filePath.split('/').length === 2 &&
      (filePath.endsWith('/index.ts') || filePath.endsWith('/index.tsx')))
  );
}

// ------------------------------------------------------
// Create export entry for a given src file
// ------------------------------------------------------
function createExportEntry(
  srcPath: string,
): [string, { types: string; import: string; require: string }] {
  const parsedPath = path.parse(srcPath);
  let exportKey = `./${parsedPath.dir}`;

  // If it's the top-level index (e.g. "index.ts"), export key is "."
  if (parsedPath.name === 'index' && parsedPath.dir === '') {
    exportKey = '.';
  }
  // Otherwise, if it's not an "index.ts", export the file path
  else if (parsedPath.name !== 'index') {
    exportKey = `./${srcPath.replace(/\.(ts|tsx)$/, '')}`;
  }

  // Decide the final base path for the output
  let basePath: string;
  if (exportKey === '.') {
    // Root export goes under OUTPUT_DIR
    basePath = `${OUTPUT_DIR}/index`;
  } else {
    // For non-root exports, remove 'index' from the path
    const pathWithoutExt = srcPath.replace(/\.tsx?$/, '');
    const pathWithoutIndex = pathWithoutExt.replace(/\/index$/, '');
    basePath = pathWithoutIndex.startsWith(`${SRC_DIR}/`)
      ? pathWithoutIndex.replace(new RegExp(`^${SRC_DIR}/`), `${OUTPUT_DIR}/`)
      : `${OUTPUT_DIR}/${pathWithoutIndex}`;
  }

  return [
    exportKey,
    {
      types: `./${basePath}.d.ts`,
      import: `./${basePath}.mjs`,
      require: `./${basePath}.js`,
    },
  ];
}

// ------------------------------------------------------
// Build export map and write it to package.json
// ------------------------------------------------------
async function buildExportMap(pkgJsonPath: string) {
  const pkgDir = path.dirname(pkgJsonPath);
  const srcDir = path.join(pkgDir, SRC_DIR);

  const pkg = readJSONSync(pkgJsonPath);
  const sourceFiles = await findSourceFiles(srcDir);
  const topLevelFiles = sourceFiles.filter(isTopLevelFile);

  const exports: ExportMap = Object.fromEntries(
    topLevelFiles
      .map((file) => {
        const [key, entry] = createExportEntry(file);
        return [key, entry] as const;
      })
      .sort((a, b) => {
        const aKey = a[0];
        const bKey = b[0];

        if (aKey === '.') return -1;
        if (bKey === '.') return 1;

        return aKey?.localeCompare(bKey);
      }),
  );

  // Assign to pkg.exports
  pkg.exports = exports;

  // Write back with standard ordering
  const formattedPkg = formatPackageJson(pkg);
  writeJSONSync(pkgJsonPath, formattedPkg, { spaces: 2 });

  // Build tsup entry config as well
  const tsupEntry = await buildTsupEntryConfig(pkgJsonPath);

  return { exports, tsupEntry };
}

// ------------------------------------------------------
// Build tsup entry config and write to package.json
// ------------------------------------------------------
async function buildTsupEntryConfig(pkgJsonPath: string) {
  const pkgDir = path.dirname(pkgJsonPath);
  const srcDir = path.join(pkgDir, SRC_DIR);

  const pkg = readJSONSync(pkgJsonPath);
  const sourceFiles = await findSourceFiles(srcDir);
  const topLevelFiles = sourceFiles.filter(isTopLevelFile);

  const tsupEntry: Record<string, string> = Object.fromEntries(
    topLevelFiles
      .map((file) => {
        let entryKey: string;
        const fullPath = path.join(SRC_DIR, file);

        if (isTopLevelIndexFile(file)) {
          entryKey = 'index';
        } else {
          const parsedPath = path.parse(file);
          entryKey = parsedPath.dir || parsedPath.name;
        }

        return [entryKey, fullPath] as const;
      })
      .sort(([aKey], [bKey]) => {
        if (aKey === 'index') return -1;
        if (bKey === 'index') return 1;
        return aKey.localeCompare(bKey);
      }),
  );

  // Ensure bangleConfig exists
  if (!pkg.bangleConfig) {
    pkg.bangleConfig = {};
  }

  // Assign the tsup entry
  pkg.bangleConfig.tsupEntry = tsupEntry;

  // Write back with standard ordering
  const formattedPkg = formatPackageJson(pkg);
  writeJSONSync(pkgJsonPath, formattedPkg, { spaces: 2 });

  return tsupEntry;
}

// ------------------------------------------------------
// CLI usage
// ------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pkgJsonPath = process.argv[2];
  if (!pkgJsonPath) {
    console.error('Please provide a path to package.json');
    process.exit(1);
  }

  buildExportMap(pkgJsonPath).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

// ------------------------------------------------------
// Exports for usage as a module
// ------------------------------------------------------
export { buildExportMap, buildTsupEntryConfig };
