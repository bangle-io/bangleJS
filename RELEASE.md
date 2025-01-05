# Package Publishing & Release Guide

This document outlines the process for publishing new package versions and creating releases.

## Prerequisites

- Ensure you have npm account with appropriate permissions
- Have `pnpm` installed globally
- Have access to the GitHub repository with write permissions
- Ensure you have 2FA enabled for npm (required for publishing)

## Release Process

### 1. Prepare Your Environment

1. Ensure you are on the `dev` branch and up to date:
   ```bash
   git checkout dev
   git pull origin dev
   ```

2. Make sure your working directory is clean:
   ```bash
   git status
   ```

### 2. Version Bump

1. Determine the new version number following semantic versioning:
   - MAJOR version for incompatible API changes
   - MINOR version for backwards-compatible functionality
   - PATCH version for backwards-compatible bug fixes

2. Update the version across all packages:
   ```bash
   pnpm -r --filter misc set-version x.y.z
   ```
   Replace `x.y.z` with your new version number (e.g., `1.2.3`)

   This command will:
   - Update all package versions
   - Create a git commit with the version bump
   - Create a git tag in the format `vx.y.z`
   - Push the changes and tag to GitHub

### 3. Create GitHub Release

1. Visit GitHub and create a new release:
   - Go to the releases page
   - Click "New release"
   - Select the tag that was just created (`vx.y.z`)
   - Add release notes detailing the changes
   - Publish the release

### 4. Publish to npm

Choose one of the following commands based on your release type:

For alpha releases:
```bash
pnpm publish-alpha --otp=123456
```

For stable releases:
```bash
pnpm publish-latest --otp=123456
```

Replace `123456` with your actual npm 2FA code.

The publish process will:
1. Prepare package.json files with correct exports
2. Update dependencies
3. Publish packages to npm
4. Clean up temporary files
5. Revert package.json files to workspace state

## Troubleshooting

If you encounter issues during publishing:

1. **Version conflicts**: 
   - Ensure all package versions are synchronized
   - Check that the version bump was successful

2. **npm authentication**: 
   - Verify your npm login status
   - Ensure 2FA is properly set up
   - Make sure your OTP code is current when publishing

3. **Git issues**: 
   - Ensure you're on the dev branch
   - Make sure your working directory is clean
   - Check that the version tag was created correctly

## Best Practices

- Always test the packages locally before publishing
- Document breaking changes clearly in release notes
- Follow semantic versioning strictly
- Keep the changelog updated
- Use alpha releases for testing major changes
- Wait for CI checks to pass before publishing

## Scripts Reference

The release process utilizes several scripts:

- `set-version`: Updates version across all packages and creates git tag
- `publish-alpha`: Publishes alpha versions to npm
- `publish-latest`: Publishes stable versions to npm

These scripts handle the complexities of publishing in a monorepo structure. 