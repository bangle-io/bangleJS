/**
 * @file A script to bump the version of all packages in the monorepo.
 *
 * ## Usage
 * ```bash
 * pnpm release-package-set-version --vv 1.2.3 [options]
 * ```
 *
 * ### Options
 * - `-v, --version`: Version to set (required)
 * - `--dry`: Perform a dry run without actually making changes
 *
 * ### Examples
 * ```bash
 * # Set version to 1.2.3:
 * pnpm release-package-set-version -v 1.2.3
 *
 * # Dry run for version 1.2.3:
 * pnpm release-package-set-version -v 1.2.3 --dry
 * ```
 */

import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';
import { Packager } from '../packager';

interface CliOptions {
  version: string;
  dry: boolean;
}

function parseCli(): CliOptions {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: pnpm release-package-set-version --vv <version> [options]')
    .option('vv', {
      alias: 'v',
      type: 'string',
      demandOption: true,
      describe: 'Version to set',
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
    dry: argv.dry,
  };
}

async function main() {
  const { version, dry } = parseCli();
  console.log(
    `\nStarting version update process for version ${version}${dry ? ' [dry mode]' : ''}\n`,
  );

  // Initialize the packager
  const packager = new Packager({ dry });
  await packager.init();

  // Set the version across all packages and create a tag
  console.log('> Updating version in all packages...\n');
  await packager.setVersion(version);
  console.log('\n> Version update complete.\n');

  console.log(`Next steps: 
    1. Create a release on GitHub for tag v${version}.
    2. To publish, run: pnpm release-package-publish${' --otp=<CODE>'}\n`);
}

main().catch((err) => {
  console.error('Version update process failed:', err);
  process.exit(1);
}); 