import path from 'node:path';
import type { MonorepoRoot, Package } from '@manypkg/tools';
import fs from 'fs-extra';

export async function copyReadMe(pkg: Package, root: MonorepoRoot) {
  const packagePath = pkg.dir;

  return {
    prepublish: async () => {
      await fs.copyFile(
        path.join(root.rootDir, 'README.md'),
        path.join(packagePath, 'README.md'),
      );

      console.log('Copied README.md to', packagePath);
    },
    postpublish: async () => {
      await fs.remove(path.join(packagePath, 'README.md'));

      console.log('Unlinked README.md from', packagePath);
    },
  };
}
