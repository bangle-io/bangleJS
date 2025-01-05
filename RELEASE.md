# Package Publishing & Release Guide

This document outlines the process for publishing new package versions and creating releases.

## Prerequisites

- Ensure you have npm account with appropriate permissions
- Have `pnpm` installed globally
- Have access to the GitHub repository with write permissions
- Ensure you have 2FA enabled for npm (required for publishing)



1. ensure you are in `dev` branch and upto date with dev (`git pull origin dev`).

1. Figure out older version and what version you wanna release.

1. Run `pnpm -r --filter misc set-version x.y.z` to bump the version.

1. Go to github and create a new release with the tag that was created in the previous step.

1. Run `pnpm publish-alpha --otp=123456` or `publish-latest` to publish the packages to npm.
