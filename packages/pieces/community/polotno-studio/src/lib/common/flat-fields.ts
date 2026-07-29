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
    const raw = String(value).trim();
    if (raw === '') return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  }
  const s = String(value);
  return s === '' ? undefined : s;
}

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
