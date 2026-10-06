/**
 * Slug and reference-code helpers (AGENTS.md §10).
 */

/**
 * Lowercase, strip accents (NFD), non-alphanumeric → `-`, collapse/trim `-`.
 * "Barbería Don Rafa" → "barberia-don-rafa"; "Estudio de Uñas Luna" →
 * "estudio-de-unas-luna".
 */
export function slugify(value: string): string {
  // NFD splits an accented glyph into base letter + combining mark; removing
  // combining marks (`\p{M}`) leaves the plain ASCII letter behind, so é → e
  // and ñ → n without an external library (D8).
  return value
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Collision suffix per §10: append `-2`, `-3`, … until the slug is free. */
export function uniqueSlug(base: string, takenSlugs: ReadonlySet<string>): string {
  if (!takenSlugs.has(base)) return base;
  let suffix = 2;
  while (takenSlugs.has(`${base}-${suffix}`)) suffix += 1;
  return `${base}-${suffix}`;
}

// §10: no ambiguous characters (no 0/O, 1/I/L) so codes survive being read
// aloud or typed by hand. `used` is mutated — the generated code is registered
// before returning so concurrent calls in the same store can't repeat it.
const REFERENCE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export function makeReference(used: Set<string>): string {
  let reference = '';
  do {
    const bytes = crypto.getRandomValues(new Uint8Array(6));
    const chars = Array.from(bytes, (byte) => REFERENCE_ALPHABET[byte % REFERENCE_ALPHABET.length]);
    reference = `PIK-${chars.join('')}`;
  } while (used.has(reference));
  used.add(reference);
  return reference;
}
