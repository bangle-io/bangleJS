/**
 * @file A script to bump the version of all packages in the monorepo and optionally publish them to npm.
 *
 * ## Usage
 * ```bash
 * pnpm release-package --version 1.2.3 [options]
 * ```
 *
 * ### Options
 * - `-v, --version`: Version to release (required)
 * - `--alpha`: Publish with an `alpha` dist-tag
 * - `--publish`: Publish packages to npm (otherwise just bump the versions)
 * - `--otp <CODE>`: Provide an npm one-time password (2FA code) for the publish
 * - `--dry`: Perform a dry run without actually making changes
 *
 * ### Examples
 * ```bash
 * # Bump version to 1.2.3 (no publish):
 * pnpm release-package -v 1.2.3
 *
 * # Bump version to 1.2.3 and publish:
 * pnpm release-package --version 1.2.3 --publish --otp=123456
 *
 * # Bump version to 1.2.3-alpha.0 and publish under the `alpha` dist-tag:
 * pnpm release-package -v 1.2.3-alpha.0 --alpha --publish --otp=123456
 * ```
 */

import { execSync } from 'node:child_process';
import yargs from 'yargs/yargs';
import { hideBin } from 'yargs/helpers';
import { Packager } from '../packager';

interface CliOptions {
  version: string;
  alpha: boolean;
  publish: boolean;
  otp: string;
  dry: boolean;
}

function parseCli(): CliOptions {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: pnpm release-package --vv <version> [options]')
    .option('vv', {
      alias: 'v',
      type: 'string',
      demandOption: true,
      describe: 'Version to release',
    })
    .option('alpha', {
      type: 'boolean',
      default: false,
      describe: 'Release an alpha version with --tag alpha',
    })
    .option('publish', {
      type: 'boolean',
      default: false,
      describe: 'Publish packages to npm. If not set, only the version bump is performed.',
    })
    .option('otp', {
      type: 'string',
      default: '',
      describe: 'One-time password (2FA) for npm publish',
    })
    .option('dry', {
      type: 'boolean',
      default: false,
      describe: 'Perform a dry run without making changes',
    })
    .check((args) => {
      // Simple semver-like check
      if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(args.vv)) {
        throw new Error(`Invalid version format: "${args.vv}"`);
      }
      return true;
    })
    .strict()
    .help()
    .parseSync();

  return {
    version: argv.vv,
    alpha: argv.alpha,
    publish: argv.publish,
    otp: argv.otp,
    dry: argv.dry,
  };
}

async function main() {
  const { version, alpha, publish, otp, dry } = parseCli();
  console.log(`\nStarting release process for version ${version}${alpha ? ' (alpha)' : ''}${dry ? ' [dry mode]' : ''}\n`);

  // Initialize the packager
  const packager = new Packager({ dry });
  await packager.init();

  // 1. Set the version across all packages and create a tag
  //    This also handles git commit and push if not in dry mode
  console.log('> Updating version in all packages...\n');
  await packager.setVersion(version);
  console.log('\n> Version update complete.\n');

  if (!publish) {
    console.log('No publish requested. Version bump complete.\n');
    console.log(`Next steps: 
      1. Create a release on GitHub for tag v${version}.
      2. To publish later, run: pnpm release-package ${version} --publish${alpha ? ' --alpha' : ''} --otp=<CODE>\n`);
    return;
  }

  // 2. Publish all non-private packages
  const tagFlag = alpha ? '--tag alpha' : '--tag latest';
  console.log(`> Publishing packages to npm with ${alpha ? 'alpha' : 'latest'} tag...\n`);

  for (const pkg of packager.packages) {
    if (pkg.packageJson.private) {
      console.log(`Skipping private package: ${pkg.packageJson.name}`);
      continue;
    }

    const cmd = `npm publish ${tagFlag}${otp ? ` --otp=${otp}` : ''}`;
    console.log(`\n--- Publishing ${pkg.packageJson.name} ---`);
    await packager.publishPackage(pkg.packageJson.name, {
      publishCommand: cmd,
      cleanup: true,
    });
  }

  console.log('\n> Publish process complete!\n');
  console.log(`Visit GitHub to finalize release notes under tag v${version}.\n`);
}

main().catch((err) => {
  console.error('Release process failed:', err);
  process.exit(1);
});
