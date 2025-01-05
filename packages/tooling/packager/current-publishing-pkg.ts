// These values are auto set by npm when publishing
export const currentPublishingPkgName: string =
  (process.env as any).npm_package_name || 'unknown';
export const currentPublishingPkgVersion: string =
  (process.env as any).npm_package_version || 'unknown';
