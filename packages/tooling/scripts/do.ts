import { Packager } from '../packager';

async function main() {
  const packager = new Packager({});
  await packager.init();

  // Update export maps for each package
  for (const pkg of packager.packages) {
    if (pkg.packageJson.private) {
      continue;
    }

    try {
      //   await packager.updateExportMapToSrc(pkg.packageJson.name);
      await packager.preparePackageForPublish(pkg.packageJson.name);
      console.log(`✓ Updated export map for ${pkg.packageJson.name}`);
    } catch (error) {
      console.error(
        `✗ Failed to update export map for ${pkg.packageJson.name}:`,
        error,
      );
    }
  }
}

main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
