import type { FieldDef } from './types';

function coerce(type: FieldDef['type'], value: unknown): unknown {
  if (type === 'boolean') {
    if (typeof value === 'boolean') return value;
    if (value === 'true' || value === 1 || value === '1') return true;
    if (value === 'false' || value === 0 || value === '0') return false;
    return undefined;
  }
  if (type === 'integer') {
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
    // Number('') is 0, and font_size rejects 0 outright, so a cleared box must
    // mean "unset" — matching the string branch below.
    const raw = String(value).trim();
    if (raw === '') return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  const s = String(value);
  return s === '' ? undefined : s;
}

/**
 * Build the `dynamic_fields_flat` payload.
 *
 * Keys come straight from GET /v1/templates/{id}/dynamic-fields and are sent
 * verbatim; the backend reassembles them. A key with no matching def is passed
 * through untouched so the server's unknown_dynamic_field error decides, rather
 * than this piece silently dropping a value the user typed.
 */
export function toFlatFields(defs: FieldDef[], values: Record<string, unknown>): Record<string, unknown> {
  const byKey = new Map(defs.map((d) => [d.key, d]));
  const out: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(values)) {
    if (raw === undefined || raw === null) continue;
    const def = byKey.get(key);
    if (!def) {
      out[key] = raw;
      continue;
    }
    const coerced = coerce(def.type, raw);
    if (coerced !== undefined) out[key] = coerced;
  }
  return out;
}
