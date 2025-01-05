/**
 * @file A script to publish packages to npm.
 *
 * ## Usage
 * ```bash
 * pnpm release-package-publish [options]
 * ```
 *
 * ### Options
 * - `--alpha`: Publish with an `alpha` dist-tag
 * - `--otp <CODE>`: Provide an npm one-time password (2FA code) for the publish
 * - `--dry`: Perform a dry run without actually making changes
 *
 * ### Examples
 * ```bash
 * # Publish packages:
 * pnpm release-package-publish --otp=123456
 *
 * # Publish under the `alpha` dist-tag:
 * pnpm release-package-publish --alpha --otp=123456
 * ```
 */

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { Packager } from '../packager';

interface CliOptions {
  alpha: boolean;
  otp: string;
  dry: boolean;
}

function parseCli(): CliOptions {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: pnpm release-package-publish [options]')
    .option('alpha', {
      type: 'boolean',
      default: false,
      describe: 'Release an alpha version with --tag alpha',
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
    .strict()
    .help()
    .parseSync();

  return {
    alpha: argv.alpha,
    otp: argv.otp,
    dry: argv.dry,
  };
}

async function main() {
  const { alpha, otp, dry } = parseCli();
  console.log(
    `\nStarting publish process${alpha ? ' (alpha)' : ''}${dry ? ' [dry mode]' : ''}\n`,
  );

  // Initialize the packager
  const packager = new Packager({ dry });
  await packager.init();

  // Publish all non-private packages
  const tagFlag = alpha ? '--tag alpha' : '--tag latest';
  console.log(
    `> Publishing packages to npm with ${alpha ? 'alpha' : 'latest'} tag...\n`,
  );

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
  console.log('Visit GitHub to finalize release notes.\n');
}

main().catch((err) => {
  console.error('Publish process failed:', err);
  process.exit(1);
}); 