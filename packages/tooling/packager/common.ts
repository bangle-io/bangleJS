export interface ExportMapResult {
  main?: string;
  module?: string;
  types?: string;
  /** The export map object */
  exports: Record<
    string,
    string | { import?: string; require?: string; types?: string }
  >;
}
/**
 * Sorts an object's keys based on a provided comparison function.
 * If no comparison function is provided, uses localeCompare.
 * @param obj The object to sort
 * @param compareFunction Optional comparison function for custom sorting
 * @returns A new object with sorted keys
 */
export function sortObject<T extends object>(
  obj: T,
  compareFunction: (a: string, b: string) => number = (a, b) =>
    a.localeCompare(b),
): T {
  return Object.fromEntries(
    Object.entries(obj).sort(([keyA], [keyB]) => compareFunction(keyA, keyB)),
  ) as T;
}

export function removeUndefinedValues(obj: Record<string, any>) {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined),
  );
}
