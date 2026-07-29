import type { FieldDef } from './types';

export function toFlatFields({ defs, values }: ToFlatFieldsParams): Record<string, unknown> {
  const byKey = new Map(defs.map((d) => [d.key, d]));
  const out: Record<string, unknown> = {};

  for (const [key, raw] of Object.entries(values)) {
    if (raw === undefined || raw === null) continue;
    const def = byKey.get(key);
    if (!def) {
      out[key] = raw;
      continue;
    }
    const coerced = coerce({ type: def.type, value: raw });
    if (coerced !== undefined) out[key] = coerced;
  }
  return out;
}

function coerce({ type, value }: CoerceParams): unknown {
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

interface ToFlatFieldsParams {
  defs: FieldDef[];
  values: Record<string, unknown>;
}

interface CoerceParams {
  type: FieldDef['type'];
  value: unknown;
}
