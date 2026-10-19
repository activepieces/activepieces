import { OdooFieldMap } from './client';

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

function toOdooDatetime(input: number | Date): string {
  const d = typeof input === 'number' ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) throw new Error('Invalid date.');
  return (
    `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())} ` +
    `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
  );
}

function parseOdooDatetime(value: unknown): number | null {
  if (typeof value !== 'string' || value.length === 0) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?)?$/.exec(value.trim());
  if (!match) return null;
  const [, y, mo, d, h = '0', mi = '0', s = '0'] = match;
  return Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi), Number(s));
}

function inputToOdooDatetime({ value, label }: LabelledValue): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const text = String(value).trim();
  const hasZone = /(Z|[+-]\d{2}:?\d{2})$/.test(text);
  const epoch = hasZone ? Date.parse(text) : parseOdooDatetime(text) ?? Number.NaN;
  if (Number.isNaN(epoch)) {
    throw new Error(`${label} must be a date like 2026-10-01 or 2026-10-01T09:30:00Z.`);
  }
  return toOdooDatetime(epoch);
}

function inputToOdooDate({ value, label }: LabelledValue): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(String(value).trim());
  if (!match) throw new Error(`${label} must be a date like 2026-10-01.`);
  return match[1];
}

function parseDomain({ value, label = 'Domain' }: { value: unknown; label?: string }): Domain {
  if (value === undefined || value === null || value === '') return [];
  const parsed = typeof value === 'string' ? parseJson({ text: value, label, example: '[["is_company", "=", true]]' }) : value;
  if (!Array.isArray(parsed)) {
    throw new Error(`${label} must be a list of [field, operator, value] triples.`);
  }
  return parsed.map((term, index) => toDomainTerm({ term, index, label }));
}

function toDomainTerm({ term, index, label }: { term: unknown; index: number; label: string }): DomainTerm {
  if (term === '&' || term === '|' || term === '!') return term;
  if (Array.isArray(term) && term.length === 3 && typeof term[0] === 'string' && typeof term[1] === 'string') {
    return [term[0], term[1], term[2]];
  }
  throw new Error(`${label}: item ${index + 1} must be [field, operator, value] or one of "&", "|", "!".`);
}

function andDomains(domains: Domain[]): Domain {
  const nonEmpty = domains.filter((d) => d.length > 0);
  if (nonEmpty.length <= 1) return nonEmpty[0] ?? [];
  const expressions = nonEmpty.flatMap((d) => splitExpressions(d));
  return [...expressions.slice(1).map((): DomainTerm => '&'), ...expressions.flat()];
}

function orConditions(conditions: Condition[]): Domain {
  if (conditions.length === 0) return [];
  return [...conditions.slice(1).map((): DomainTerm => '|'), ...conditions];
}

function arity(term: DomainTerm): number {
  if (term === '&' || term === '|') return 2;
  if (term === '!') return 1;
  return 0;
}

function splitExpressions(domain: Domain): Domain[] {
  const expressions: Domain[] = [];
  let i = 0;
  while (i < domain.length) {
    const start = i;
    let needed = 1;
    while (needed > 0 && i < domain.length) {
      needed = needed - 1 + arity(domain[i]);
      i++;
    }
    expressions.push(domain.slice(start, i));
  }
  return expressions;
}

function parseJson({ text, label, example }: { text: string; label: string; example: string }): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} must be JSON, for example ${example}.`);
  }
}

function toId({ value, label }: LabelledValue): number {
  const n = typeof value === 'number' ? value : Number(String(value ?? '').trim());
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(`${label} must be a positive whole number (an Odoo record ID).`);
  }
  return n;
}

function optionalId({ value, label }: LabelledValue): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  return toId({ value, label });
}

function toIdList({ value, label, allowEmpty = false }: LabelledValue & { allowEmpty?: boolean }): number[] {
  const list = asList({ value, label });
  const ids = list.map((item) => toId({ value: item, label }));
  if (!allowEmpty && ids.length === 0) throw new Error(`${label} must contain at least one ID.`);
  return Array.from(new Set(ids));
}

function asList({ value, label }: LabelledValue): unknown[] {
  if (value === undefined || value === null || value === '') return [];
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    const text = value.trim();
    if (text.startsWith('[')) {
      const parsed = parseJson({ text, label, example: '[12, 15]' });
      return Array.isArray(parsed) ? parsed : [parsed];
    }
    return text
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }
  return [value];
}

function toStringList(value: unknown): string[] {
  if (value === undefined || value === null || value === '') return [];
  const list = Array.isArray(value) ? value : String(value).split(',');
  return list.map((v) => String(v).trim()).filter((v) => v.length > 0);
}

function parseObject({ value, label, allowEmpty = false }: LabelledValue & { allowEmpty?: boolean }): Record<string, unknown> {
  const parsed = typeof value === 'string' && value.trim() !== '' ? parseJson({ text: value, label, example: '{"name": "Acme"}' }) : value;
  const record = parsed === undefined || parsed === null || parsed === '' ? {} : parsed;
  if (!isRecord(record)) throw new Error(`${label} must be a JSON object.`);
  if (!allowEmpty && Object.keys(record).length === 0) throw new Error(`${label} must set at least one field.`);
  return record;
}

function parseArray({ value, label }: LabelledValue): unknown[] {
  if (value === undefined || value === null || value === '') return [];
  const parsed = typeof value === 'string' ? parseJson({ text: value, label, example: '[1, "a"]' }) : value;
  if (!Array.isArray(parsed)) throw new Error(`${label} must be a JSON list.`);
  return parsed;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function toOptionalNumber({ value, label }: LabelledValue): number | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const n = typeof value === 'number' ? value : Number(String(value).trim());
  if (!Number.isFinite(n)) throw new Error(`${label} must be a number.`);
  return n;
}

function clampLimit({ value, fallback, max }: { value: unknown; fallback: number; max: number }): number {
  if (value === undefined || value === null || value === '') return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new Error('Limit must be a whole number of at least 1.');
  return Math.min(n, max);
}

function toOffset(value: unknown): number {
  if (value === undefined || value === null || value === '') return 0;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) throw new Error('Offset must be a whole number of at least 0.');
  return n;
}

function toModelName(value: unknown): string {
  const model = String(value ?? '').trim();
  if (!/^[a-z_][a-z0-9_]*(\.[a-z0-9_]+)*$/i.test(model)) {
    throw new Error(`"${model}" is not a valid Odoo model name. Use the technical name, for example res.partner.`);
  }
  return model;
}

function toMethodName({ value, actions }: { value: unknown; actions: DedicatedActions }): string {
  const method = String(value ?? '').trim();
  if (!/^[a-z][a-z0-9_]*$/i.test(method)) {
    throw new Error(
      `"${method}" is not a callable Odoo method. Use a public method name such as action_confirm (Odoo refuses names starting with "_").`,
    );
  }
  const refusal = refusedMethod({ method: method.toLowerCase(), actions });
  if (refusal) throw new Error(`"${method}" cannot be called here. ${refusal}`);
  return method;
}

function refusedMethod({ method, actions }: { method: string; actions: DedicatedActions }): string | null {
  if (method === 'unlink') return `Use ${actions.delete} to delete records.`;
  if (method === 'write' || method === 'update') return `Use ${actions.update} to change field values.`;
  if (method === 'create' || method === 'name_create' || method === 'load') return `Use ${actions.create} to create records.`;
  if (method === 'web_save') return `Use ${actions.update} to change field values, or ${actions.create} to create records.`;
  if (method === 'copy') return `Use ${actions.create} to create a new record with the values you want.`;
  if (method === 'browse') return `Use ${actions.read} to read records.`;
  if (ENVIRONMENT_METHODS.includes(method)) {
    return 'It changes the user or environment of the call. Call the business method directly; pass context values as the "context" keyword argument.';
  }
  return null;
}

function definedOnly(values: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
}

function optionalText(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  const text = String(value);
  return text.trim() === '' ? undefined : text;
}

function normalizeRecord({
  record,
  fields,
  requested,
}: {
  record: Record<string, unknown>;
  fields: OdooFieldMap;
  requested?: readonly string[];
}): Record<string, unknown> {
  const keys = requested ?? Object.keys(record);
  return Object.fromEntries(keys.flatMap((key) => normalizeField({ key, raw: key in record ? record[key] : null, type: fields[key]?.type })));
}

function normalizeField({ key, raw, type }: { key: string; raw: unknown; type: string | undefined }): [string, unknown][] {
  if (type === 'many2one') {
    if (Array.isArray(raw) && raw.length >= 1) return [[key, raw[0]], [`${key}_name`, raw.length > 1 ? raw[1] : null]];
    if (typeof raw === 'number') return [[key, raw], [`${key}_name`, null]];
    return [[key, null], [`${key}_name`, null]];
  }
  if (type === 'boolean') return [[key, raw === null || raw === undefined ? null : Boolean(raw)]];
  if (type === 'one2many' || type === 'many2many') return [[key, Array.isArray(raw) ? raw : []]];
  return [[key, raw === false || raw === undefined ? null : raw]];
}

function firstId(value: unknown): number | null {
  if (typeof value === 'number') return value;
  if (Array.isArray(value) && typeof value[0] === 'number') return value[0];
  return null;
}

const ENVIRONMENT_METHODS = ['sudo', 'with_user', 'with_context', 'with_env'];

export const odooDates = {
  toOdooDatetime,
  parseOdooDatetime,
  inputToOdooDatetime,
  inputToOdooDate,
};

export const odooDomain = {
  parseDomain,
  andDomains,
  orConditions,
};

export const odooInput = {
  toId,
  optionalId,
  toIdList,
  toStringList,
  parseObject,
  parseArray,
  toOptionalNumber,
  clampLimit,
  toOffset,
  toModelName,
  toMethodName,
  definedOnly,
  optionalText,
  isRecord,
};

export const odooOutput = {
  normalizeRecord,
  firstId,
};

export type Condition = [string, string, unknown];
export type DomainTerm = Condition | '&' | '|' | '!';
export type Domain = DomainTerm[];
export type DedicatedActions = { delete: string; update: string; create: string; read: string };
type LabelledValue = { value: unknown; label: string };
