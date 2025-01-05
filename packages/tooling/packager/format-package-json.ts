import type { PackageJSON } from '@manypkg/tools';

export function formatPackageJson(pkg: Record<string, any>): PackageJSON {
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
