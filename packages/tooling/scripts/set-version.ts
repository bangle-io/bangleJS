import { findRoot, setVersion } from '@bangle.dev/packager';
import { hideBin } from 'yargs/helpers';
import yargs from 'yargs/yargs';

interface CliOptions {
  version: string;
  skipGitChecks?: boolean;
  dry?: boolean;
}

function parseCli(): CliOptions {
  const argv = yargs(hideBin(process.argv))
    .usage('Usage: $0 --vv <version> [options]')
    .option('vv', {
      alias: 'v',
      type: 'string',
      demandOption: true,
      describe: 'Version to set',
    })
    .option('skip-git-checks', {
      type: 'boolean',
      default: false,
      describe: 'Skip git checks and operations',
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
    skipGitChecks: argv['skip-git-checks'],
    dry: argv.dry,
  };
}

async function main() {
  const options = parseCli();
  console.log(
    `\nStarting version update process for version ${options.version}${options.dry ? ' [dry mode]' : ''}\n`,
  );

  const root = await findRoot(process.cwd());

  // Set the version across all packages and create a tag
  console.log('> Updating version in all packages...\n');
  await setVersion(root, options.version, {
    skipGitChecks: options.skipGitChecks ?? false,
    gitBranch: 'dev',
    githubRepoUrl: 'https://github.com/bangle-io/banger-editor',
    dry: options.dry ?? false,
  });

  console.log('\n> Version update complete.\n');
}

main().catch((err) => {
  console.error('Version update process failed:', err);
  process.exit(1);
});
