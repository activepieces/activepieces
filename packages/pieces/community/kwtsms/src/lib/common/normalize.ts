// 2026-11-16 +03: pure helpers (no framework imports, unit-testable): phone and message cleaning per kwtSMS API docs.

const ARABIC_INDIC_ZERO = 0x0660;
const PERSIAN_ZERO = 0x06f0;

function toLatinDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (ch) => {
    const code = ch.charCodeAt(0);
    return String(
      code >= PERSIAN_ZERO ? code - PERSIAN_ZERO : code - ARABIC_INDIC_ZERO,
    );
  });
}

/** One raw number to digits only with country code: 965XXXXXXXX. Returns '' if nothing is left. */
export function normalizePhone(raw: string): string {
  const digits = toLatinDigits(String(raw ?? '')).replace(/\D/g, '');
  return digits.replace(/^0+/, '');
}

/** Accepts items that may hold several numbers separated by comma, semicolon or newline. Normalizes and dedupes. */
export function normalizePhones(input: unknown): string[] {
  const items = Array.isArray(input) ? input : [input];
  const seen = new Set<string>();
  for (const item of items) {
    if (item === null || item === undefined) continue;
    for (const part of String(item).split(/[,;\n\r]+/)) {
      const n = normalizePhone(part);
      if (n) seen.add(n);
    }
  }
  return [...seen];
}

/** Split into request batches: max 200 numbers and 2500 characters of the joined list (API limits). */
export function chunkPhones(
  phones: string[],
  maxCount = 200,
  maxChars = 2500,
): string[][] {
  const batches: string[][] = [];
  let current: string[] = [];
  let chars = 0;
  for (const p of phones) {
    const add = p.length + (current.length ? 1 : 0);
    if (current.length >= maxCount || chars + add > maxChars) {
      batches.push(current);
      current = [];
      chars = 0;
    }
    chars += p.length + (current.length ? 1 : 0);
    current.push(p);
  }
  if (current.length) batches.push(current);
  return batches;
}

/** Strip emoji, hidden/control characters and HTML tags (the API rejects HTML with ERR027). Keeps newlines. */
export function cleanMessage(raw: string): string {
  return String(raw ?? '')
    .replace(/<[^>]*>/g, '')
    .replace(
      /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2300}-\u{23FF}\u{2B00}-\u{2BFF}\u{FE00}-\u{FE0F}\u{E0000}-\u{E007F}\u{1F1E6}-\u{1F1FF}\u{200D}\u{20E3}\u{00A9}\u{00AE}\u{203C}\u{2049}\u{2122}\u{2139}\u{2190}-\u{21FF}\u{25A0}-\u{25FF}\u{3030}\u{303D}\u{3297}\u{3299}]/gu,
      '',
    )
    .replace(
      /[​-‏‪-‮⁠-⁤⁦-⁯﻿­؜᠎]/g,
      '',
    )
    .replace(/\r\n?/g, '\n')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .trim();
}
