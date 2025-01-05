import { execSync } from 'node:child_process';
import path from 'node:path';
import { findRootSync } from '@manypkg/find-root';
import {
  type Package,
  getPackages,
  getPackagesSync,
} from '@manypkg/get-packages';
import type { PackageJSON } from '@manypkg/tools';
import fs from 'fs-extra';
import { globby } from 'globby';
import { set } from 'lodash';

interface PackagerConfig {
  /** Root directory of the monorepo. If not provided, will be auto-detected */
  rootDir?: string;
  /** Git branch to use for version bumps, defaults to 'dev' */
  gitBranch?: string;
  /** GitHub repository URL for release notes */
  githubRepoUrl?: string;

  /** Whether to skip git checks, defaults to false */
  skipGitChecks?: boolean;
  /** Default documentation directory */
  docsDir?: string;
  /** Distribution directory name, defaults to 'dist' */
  distDir?: string;
  /** Source directory name, defaults to 'src' */
  srcDir?: string;
  /** Package.json field to store tsup entry config, defaults to 'bangleConfig.tsupEntry' */
  tsupEntryField?: string;
  /** Glob patterns to ignore when generating tsup config */
  tsupIgnorePatterns?: string[];
}

interface PublishConfig {
  /** Whether to clean up after publishing */
  cleanup?: boolean;
  /** Additional files to include in the package */
  additionalFiles?: string[];
}

class Packager {
  private config: Required<PackagerConfig>;
  public packages: Package[] = [];
  private initialized = false;
  private root: ReturnType<typeof findRootSync>;

  constructor(config: PackagerConfig) {
    this.root = findRootSync(config.rootDir || process.cwd());

    this.config = {
      gitBranch: 'dev',
      githubRepoUrl: 'https://github.com/bangle-io/nalanda',
      skipGitChecks: false,
      docsDir: 'docs',
      distDir: 'dist',
      srcDir: 'src',
      tsupEntryField: 'bangleConfig.tsupEntry',
      tsupIgnorePatterns: [
        '**/__tests__/**',
        '**/*.{spec,test}.{ts,tsx}',
        '**/.*/**',
      ],
      rootDir: this.root.rootDir,
      ...config,
    };
  }

  public async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    const result = await this.root.tool.getPackages(this.config.rootDir);
    this.packages = result.packages;
    this.initialized = true;
  }

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error(
        'Packager must be initialized before use. Call init() first.',
      );
    }
  }

  /**
   * Sets the version of all packages.
   * @param version - The new version string.
   */
  public async setVersion(version: string): Promise<void> {
    this.ensureInitialized();

    if (!isValidVersionFormat(version)) {
      throw new Error('Invalid version format.');
    }

    if (!this.config.skipGitChecks && isGitDirty()) {
      throw new Error(
        'Your git working directory has uncommitted changes. Please commit or stash them before running this script.',
      );
    }

    for (const pkg of this.packages) {
      const packageJsonPath = path.join(pkg.dir, 'package.json');
      const packageJson = await fs.readJson(packageJsonPath);
      packageJson.version = version;
      await fs.writeJson(packageJsonPath, packageJson, { spaces: 2 });
    }

    if (!this.config.skipGitChecks) {
      try {
        execSync(
          `git checkout ${this.config.gitBranch} && git pull origin ${this.config.gitBranch}`,
          {
            cwd: this.config.rootDir,
          },
        );
        execSync(`git add -A && git commit -m "Bump version to ${version}"`, {
          cwd: this.config.rootDir,
        });
        execSync(`git tag -a v${version} -m "release v${version}"`, {
          cwd: this.config.rootDir,
        });
        execSync(`git push origin v${version}`, { cwd: this.config.rootDir });
        execSync('git push origin HEAD --tags', { cwd: this.config.rootDir });
        console.log(`Committed and tagged version ${version}.`);
        console.log(
          `Visit ${this.config.githubRepoUrl}/releases/new?tag=v${version} to add release notes.`,
        );
      } catch (error) {
        if (error instanceof Error) {
          console.error(
            'Error committing or tagging the version:',
            error.message,
          );
        } else {
          throw error;
        }
        process.exit(1);
      }
    }
  }

  /**
   * Copies the distribution files of a package to the documentation directory.
   */
  public async copyDistToDocs(
    packageName: string,
    finalFileName: string,
    docsDir = this.config.docsDir,
  ): Promise<void> {
    this.ensureInitialized();

    const pkg = this.findPackage(packageName);
    const sourcePath = path.join(pkg.dir, this.config.distDir, 'index.mjs');
    const destinationPath = path.join(docsDir, `${finalFileName}.mjs`);

    if (fs.existsSync(sourcePath)) {
      await fs.promises.copyFile(sourcePath, destinationPath);
      console.log(
        `Copied ${this.config.distDir}/index.mjs from ${packageName} to ${destinationPath}`,
      );
    } else {
      throw new Error(
        `File ${this.config.distDir}/index.mjs not found in ${packageName}`,
      );
    }
  }

  //   returns top level files and directories in src dir
  private async getSrcTopLevelItems(pkgDir: string): Promise<string[]> {
    const topLevelFiles = await globby('**/*.{ts,tsx}', {
      cwd: path.join(pkgDir, this.config.srcDir),
      ignore: this.config.tsupIgnorePatterns,
    });
    const result = topLevelFiles.filter(isTopLevelItem);

    return result;
  }

  async buildPackageJsonWithExportForPublish(
    packageName: string,
    additionalFiles: string[] = [],
  ): Promise<PackageJSON> {

    const pkg = this.findPackage(packageName);
    const packageJsonPath = path.join(pkg.dir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);

    const topLevelItems = await this.getSrcTopLevelItems(pkg.dir);
    const allFiles = [...topLevelItems, ...additionalFiles];

    const { rootExports, exportMap } = buildExportMap({
      outputDir: this.config.distDir,
      files: allFiles,
      isSrc: false,
      srcDir: this.config.srcDir,
    });

    return {
      ...packageJson,
      ...rootExports,
      exports: exportMap,
    };
  }

  /**
   * Prepares the package.json for publishing.
   */
  public async preparePackageForPublish(
    packageName: string,
    config?: PublishConfig,
  ): Promise<void> {
    this.ensureInitialized();

    const pkg = this.findPackage(packageName);
    const packageJsonPath = path.join(pkg.dir, 'package.json');
    const publishPkgJson = await this.buildPackageJsonWithExportForPublish(
      packageName,
      config?.additionalFiles,
    );

    await fs.writeJson(packageJsonPath, publishPkgJson, { spaces: 2 });

    if (config?.cleanup) {
      await this.postPublishCleanup(packageName);
    }
  }

  private findPackage(packageName: string): Package {
    const pkg = this.packages.find((p) => p.packageJson.name === packageName);
    if (!pkg) {
      throw new Error(`Package ${packageName} not found.`);
    }
    return pkg;
  }

  /**
   * Cleans up after publishing a package.
   */
  public async postPublishCleanup(packageName: string): Promise<void> {
    this.ensureInitialized();

    const pkg = this.findPackage(packageName);
    const readmePath = path.join(pkg.dir, 'README.md');

    if (fs.existsSync(readmePath)) {
      await fs.promises.unlink(readmePath);
    }

    await this.revertPackageJsonToWorkspace(packageName);
  }

  /**
   * Reverts the package.json dependencies back to workspace:*.
   */
  private async revertPackageJsonToWorkspace(
    packageName: string,
  ): Promise<void> {
    const pkg = this.findPackage(packageName);
    const packageJsonPath = path.join(pkg.dir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);

    const dependencies: Record<string, string> = {};
    for (const [depName, depVersion] of Object.entries(
      packageJson.dependencies || {},
    )) {
      if (
        this.packages.some((p) => p.packageJson.name === depName) &&
        depVersion === pkg.packageJson.version
      ) {
        dependencies[depName] = 'workspace:*';
      } else {
        dependencies[depName] = depVersion as string;
      }
    }

    const updatedPackageJson = {
      ...packageJson,
      dependencies,
    };

    await fs.writeJson(packageJsonPath, updatedPackageJson, { spaces: 2 });
  }

  /**
   * Generates tsup entry configuration for a package
   */
  public async generateTsupConfig(
    packageName: string,
  ): Promise<Record<string, string>> {
    this.ensureInitialized();

    const pkg = this.findPackage(packageName);
    const srcDir = path.join(pkg.dir, this.config.srcDir);

    const files = await globby(['**/*.{ts,tsx}'], {
      cwd: srcDir,
      ignore: this.config.tsupIgnorePatterns,
      absolute: false,
    });

    const topLevelFiles = files.filter(isTopLevelItem);

    const tsupEntry: Record<string, string> = Object.fromEntries(
      topLevelFiles
        .map((file) => {
          let entryKey: string;
          const fullPath = path.join(this.config.srcDir, file);

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

    const packageJsonPath = path.join(pkg.dir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);

    set(packageJson, this.config.tsupEntryField, tsupEntry);

    await fs.writeJson(packageJsonPath, formatPackageJson(packageJson), {
      spaces: 2,
    });

    return tsupEntry;
  }

  /**
   * Formats and standardizes package.json field ordering
   */
  public async standardizePackageJson(packageName: string): Promise<void> {
    this.ensureInitialized();

    const pkg = this.findPackage(packageName);
    const packageJsonPath = path.join(pkg.dir, 'package.json');
    const packageJson = await fs.readJson(packageJsonPath);

    await fs.writeJson(packageJsonPath, formatPackageJson(packageJson), {
      spaces: 2,
    });
  }

  /**
   * Updates the export map in package.json to use the source directory.
   */
  public async updateExportMapToSrc(packageName: string): Promise<void> {
    this.ensureInitialized();

    const pkg = this.findPackage(packageName);
    const packageJsonPath = path.join(pkg.dir, 'package.json');
    const topLevelItems = await this.getSrcTopLevelItems(pkg.dir);
    const packageJson = await fs.readJson(packageJsonPath);

    const { rootExports, exportMap } = buildExportMap({
      outputDir: this.config.srcDir,
      files: topLevelItems,
      isSrc: true,
      srcDir: this.config.srcDir,
    });

    const updatedPkgJson = {
      ...packageJson,
      ...rootExports,
      exports: exportMap,
    };

    console.log(updatedPkgJson);

    await fs.writeJson(packageJsonPath, updatedPkgJson, { spaces: 2 });
    console.log(`Updated package.json exports to use src for ${packageName}`);
  }
}

// Helper functions

function isValidVersionFormat(version: string): boolean {
  const regex = /^\d+\.\d+\.\d+(-[\w.]+)?$/;
  return regex.test(version);
}

function isGitDirty(): boolean {
  const output = execSync('git status --porcelain').toString();
  return !!output.trim();
}

function formatPackageJson(pkg: Record<string, any>): PackageJSON {
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

  const formatted: Record<string, any> = {};

  for (const field of STANDARD_FIELD_ORDER) {
    if (field in pkg) {
      formatted[field] = pkg[field];
    }
  }

  for (const field in pkg) {
    if (!STANDARD_FIELD_ORDER.includes(field)) {
      formatted[field] = pkg[field];
    }
  }

  return formatted as PackageJSON;
}

// foo.ts -> true
// index.ts -> true
// foo/bar.ts -> false
// foo/index.ts -> true
// foo/bar/index.ts -> false
function isTopLevelItem(filePath: string): boolean {
  return (
    !filePath.includes('/') ||
    (filePath.split('/').length === 2 &&
      (filePath.endsWith('/index.ts') || filePath.endsWith('/index.tsx')))
  );
}

function isTopLevelIndexFile(filePath: string): boolean {
  return filePath === 'index.ts' || filePath === 'index.tsx';
}

interface ExportMapConfig {
  /** The output directory for the files (e.g. 'dist' or 'src') */
  outputDir: string;
  /** The files to include in the export map */
  files: string[];
  /** Whether to use source directory extensions */
  isSrc: boolean;
  /** The source directory */
  srcDir: string;
}

interface ExportMapResult {
  /** Root level exports (main, module, types) */
  rootExports: {
    main?: string;
    module?: string;
    types?: string;
  };
  /** The export map object */
  exportMap: Record<string, any>;
}

function buildExportMap(config: ExportMapConfig): ExportMapResult {
  const { outputDir, isSrc, srcDir } = config;

  const files = [...config.files].sort((a, b) => a.localeCompare(b));

  const hasTopLevelIndex =
    files.includes('index.ts') || files.includes('index.tsx');

  console.log({ isSrc });
  if (isSrc) {
    return {
      rootExports: {
        main: hasTopLevelIndex ? `./${srcDir}/index.ts` : '',
      },
      exportMap: Object.fromEntries(
        files.map((file) => {
          const parsedPath = path.parse(file);
          const key = parsedPath.dir || parsedPath.name;
          const result = [`./${key}`, `./${srcDir}/${file}`];
          return result;
        }),
      ),
    };
  }

  // Initialize rootExports with all required properties
  const rootExports = {
    main: hasTopLevelIndex ? `${outputDir}/index.js` : '',
    module: hasTopLevelIndex ? `${outputDir}/index.mjs` : '',
    types: hasTopLevelIndex ? `${outputDir}/index.d.ts` : '',
  };

  const exportMap: Record<
    string,
    | string
    | {
        types: string;
        import: string;
        require: string;
      }
  > = {
    ...(hasTopLevelIndex && {
      '.': {
        types: `./${outputDir}/index.d.ts`,
        import: `./${outputDir}/index.mjs`,
        require: `./${outputDir}/index.js`,
      },
    }),
    './package.json': './package.json',
  };

  // Add subpath exports for non-index files
  files
    .filter((file) => file !== 'index.ts' && file !== 'index.tsx')
    .forEach((file) => {
      const parsedPath = path.parse(file);
      const key = parsedPath.dir || parsedPath.name;

    //   console.log(key, parsedPath);
      exportMap[`./${key}`] = {
        types: `./${outputDir}/${key}.d.ts`,
        import: `./${outputDir}/${key}.mjs`,
        require: `./${outputDir}/${key}.js`,
      };
    });


    console.log({exportMap})

  return { rootExports, exportMap };
}

export { Packager, type PackagerConfig, type PublishConfig };
