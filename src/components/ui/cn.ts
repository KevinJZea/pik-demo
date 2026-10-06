/**
 * Join conditional class names, skipping falsy entries. Stand-in for
 * clsx/tailwind-merge without adding a dependency: class conflicts are
 * avoided by passing overrides last and keeping them non-overlapping.
 */
export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(' ');
}
