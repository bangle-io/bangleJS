import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execa } from 'execa';
import { readJSONSync, writeJSONSync } from 'fs-extra';
import { globby } from 'globby';

interface ExportMap {
  [key: string]: {
    types?: string;
    import?: string;
    require?: string;
  };
}


// Standard order of package.json fields
const standardFieldOrder = [
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
  'packageManager'
];

function formatPackageJson(pkg: Record<string, any>): Record<string, any> {
  // Create a new object with fields in standard order
  const formatted: Record<string, any> = {};
  
  // First add fields in standard order
  for (const field of standardFieldOrder) {
    if (field in pkg) {
      formatted[field] = pkg[field];
    }
  }
  
  // Then add any remaining fields that weren't in our standard order
  for (const field in pkg) {
    if (!standardFieldOrder.includes(field)) {
      formatted[field] = pkg[field];
    }
  }
  
  return formatted;
}

async function findSourceFiles(srcDir: string): Promise<string[]> {
  return globby(['**/*.{ts,tsx}'], {
    cwd: srcDir,
    ignore: [
      '**/__tests__/**',
      '**/*.{spec,test}.{ts,tsx}',
      '**/.*/**',
    ],
    absolute: false,
  });
}

function isTopLevelIndexFile(filePath: string): boolean {
  return filePath === 'index.ts' || filePath === 'index.tsx';
}

function isTopLevelFile(filePath: string): boolean {
  return !filePath.includes('/') || 
    (filePath.split('/').length === 2 && (filePath.endsWith('/index.ts') || filePath.endsWith('/index.tsx')));
}

function createExportEntry(srcPath: string): [string, { types: string; import: string; require: string }] {
  const parsedPath = path.parse(srcPath);
  let exportKey = './' + parsedPath.dir;
  
  if (parsedPath.name === 'index' && parsedPath.dir === '') {
    exportKey = '.';
  } else if (parsedPath.name !== 'index') {
    exportKey = './' + srcPath.replace(/\.(ts|tsx)$/, '');
  }

  let basePath: string;
  if (exportKey === '.') {
    // Root export goes under dist
    basePath = 'dist/index';
  } else {
    // Other exports use lib directory
    basePath = srcPath.startsWith('src/') 
      ? srcPath.replace(/^src\//, 'lib/').replace(/\.tsx?$/, '')
      : 'lib/' + srcPath.replace(/\.tsx?$/, '');
  }

  return [
    exportKey,
    {
      types: './' + basePath + '.d.ts',
      import: './' + basePath + '.mjs',
      require: './' + basePath + '.js',
    },
  ];
}

async function buildExportMap(pkgJsonPath: string) {
  const pkgDir = path.dirname(pkgJsonPath);
  const srcDir = path.join(pkgDir, 'src');
  const pkg = readJSONSync(pkgJsonPath);

  const sourceFiles = await findSourceFiles(srcDir);
  const topLevelFiles = sourceFiles.filter(isTopLevelFile);

  const exports: ExportMap = {};
  
  for (const file of topLevelFiles) {
    const [key, entry] = createExportEntry(file);
    exports[key] = entry;
  }

  pkg.exports = exports;
  
  // Build tsup entry config as well
  
  // Write the final package.json with both exports and tsup entry
  const formattedPkg = formatPackageJson(pkg);

  
  writeJSONSync(pkgJsonPath, formattedPkg, { spaces: 2 });
  
  const tsupEntry = await buildTsupEntryConfig(pkgJsonPath);
  return { exports, tsupEntry };
}

async function buildTsupEntryConfig(pkgJsonPath: string) {
  const pkgDir = path.dirname(pkgJsonPath);
  const srcDir = path.join(pkgDir, 'src');
  const pkg = readJSONSync(pkgJsonPath);

  const sourceFiles = await findSourceFiles(srcDir);
  const topLevelFiles = sourceFiles.filter(isTopLevelFile);

  const tsupEntry: Record<string, string> = {};

  for (const file of topLevelFiles) {
    let entryKey: string;
    const fullPath = 'src/' + file;

    if (isTopLevelIndexFile(file)) {
      entryKey = 'index';
    }
    else {
      // For files in directories, use the directory name
      const parsedPath = path.parse(file);
      if (parsedPath.dir) {
        entryKey = parsedPath.dir;
      }
      // For top level files, use the file name without extension
      else {
        entryKey = parsedPath.name;
      }
    }

    tsupEntry[entryKey] = fullPath;
  }

  if (!pkg.bangleConfig) {
    pkg.bangleConfig = {};
  }
  pkg.bangleConfig.tsupEntry = tsupEntry;
  const formattedPkg = formatPackageJson(pkg);

  writeJSONSync(pkgJsonPath, formattedPkg, { spaces: 2 });

  return tsupEntry;
}

// For CLI usage
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const pkgJsonPath = process.argv[2];
  if (!pkgJsonPath) {
    console.error('Please provide package.json path');
    process.exit(1);
  }
  
  buildExportMap(pkgJsonPath).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

export { buildExportMap, buildTsupEntryConfig }; 