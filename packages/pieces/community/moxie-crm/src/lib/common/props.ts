import { Property } from '@activepieces/pieces-framework';

export const moxieInput = {
  text({ value }: { value: unknown }): string | undefined {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return String(value);
    }
    if (typeof value !== 'string') {
      return undefined;
    }
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  },

  requiredText({ value, field }: { value: unknown; field: string }): string {
    const text = moxieInput.text({ value });
    if (text === undefined) {
      throw new Error(`${field} is required.`);
    }
    return text;
  },

  id({ value, field }: { value: unknown; field: string }): string {
    const text = moxieInput.optionalId({ value, field });
    if (text === undefined) {
      throw new Error(`${field} is required.`);
    }
    return text;
  },

  optionalId({ value, field }: { value: unknown; field: string }): string | undefined {
    const text = moxieInput.text({ value });
    if (text === undefined) {
      return undefined;
    }
    if (/[\s/?#]/.test(text)) {
      throw new Error(`${field} "${text}" is not a valid Moxie id (it contains spaces or URL characters).`);
    }
    return text;
  },

  email({ value, field }: { value: unknown; field: string }): string | undefined {
    const text = moxieInput.text({ value });
    if (text === undefined) {
      return undefined;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
      throw new Error(`${field} "${text}" is not a valid email address.`);
    }
    return text;
  },

  httpsUrl({ value, field }: { value: unknown; field: string }): string {
    const text = moxieInput.requiredText({ value, field });
    let parsed: URL;
    try {
      parsed = new URL(text);
    } catch {
      throw new Error(`${field} "${text}" is not a valid URL.`);
    }
    if (parsed.protocol !== 'https:' || parsed.username !== '' || parsed.password !== '') {
      throw new Error(`${field} must be a public https URL without a user name or password.`);
    }
    return parsed.toString();
  },

  file({ value, field }: { value: unknown; field: string }): { filename: string; data: Buffer } {
    if (typeof value !== 'object' || value === null) {
      throw new Error(`${field} is required.`);
    }
    const filename: unknown = Reflect.get(value, 'filename');
    const data: unknown = Reflect.get(value, 'data');
    if (typeof filename !== 'string' || !Buffer.isBuffer(data)) {
      throw new Error(`${field} must be a file.`);
    }
    return { filename, data };
  },

  date({ value, field }: { value: unknown; field: string }): string | undefined {
    const text = moxieInput.text({ value });
    if (text === undefined) {
      return undefined;
    }
    const match = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(text);
    if (match === null || !isRealDate({ year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) })) {
      throw new Error(`${field} must be a date in YYYY-MM-DD format, got "${text}".`);
    }
    return text.slice(0, 10);
  },

  dateTime({ value, field }: { value: unknown; field: string }): string | undefined {
    const text = moxieInput.text({ value });
    if (text === undefined) {
      return undefined;
    }
    const time = Date.parse(text);
    if (!/^\d{4}-\d{2}-\d{2}/.test(text) || Number.isNaN(time)) {
      throw new Error(`${field} must be an ISO 8601 date and time (for example 2026-10-01T09:30:00Z), got "${text}".`);
    }
    return new Date(time).toISOString();
  },

  number({ value, field, min }: { value: unknown; field: string; min?: number }): number | undefined {
    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return undefined;
    }
    const parsed = typeof value === 'number' ? value : typeof value === 'string' ? Number(value.trim()) : Number.NaN;
    if (!Number.isFinite(parsed)) {
      throw new Error(`${field} must be a number, got "${String(value)}".`);
    }
    if (min !== undefined && parsed < min) {
      throw new Error(`${field} must be ${min} or more, got ${parsed}.`);
    }
    return parsed;
  },

  integer({ value, field, min }: { value: unknown; field: string; min?: number }): number | undefined {
    const parsed = moxieInput.number({ value, field, min });
    if (parsed !== undefined && !Number.isInteger(parsed)) {
      throw new Error(`${field} must be a whole number, got ${parsed}.`);
    }
    return parsed;
  },

  triState({ value, field }: { value: unknown; field: string }): boolean | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (value === true || value === 'yes' || value === 'true') {
      return true;
    }
    if (value === false || value === 'no' || value === 'false') {
      return false;
    }
    throw new Error(`${field} must be "yes" or "no", got "${String(value)}".`);
  },

  stringList({ value, field }: { value: unknown; field: string }): string[] | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    const items = Array.isArray(value) ? value : [value];
    const result: string[] = [];
    for (const item of items) {
      const text = moxieInput.text({ value: item });
      if (text === undefined) {
        if (item === undefined || item === null || item === '') {
          continue;
        }
        throw new Error(`${field} must be a list of text values.`);
      }
      result.push(text);
    }
    return result.length === 0 ? undefined : result;
  },

  integerList({ value, field }: { value: unknown; field: string }): number[] | undefined {
    const items = moxieInput.stringList({ value, field });
    if (items === undefined) {
      return undefined;
    }
    return items.map((item) => {
      const parsed = moxieInput.integer({ value: item, field, min: 0 });
      if (parsed === undefined) {
        throw new Error(`${field} must be a list of numeric ids.`);
      }
      return parsed;
    });
  },

  record({ value, field }: { value: unknown; field: string }): Record<string, unknown> | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    let parsed: unknown = value;
    if (typeof value === 'string') {
      try {
        parsed = JSON.parse(value);
      } catch {
        throw new Error(`${field} must be an object of field name to value.`);
      }
    }
    if (!isPlainRecord(parsed)) {
      throw new Error(`${field} must be an object of field name to value.`);
    }
    return Object.keys(parsed).length === 0 ? undefined : parsed;
  },

  recordList({ value, field }: { value: unknown; field: string }): Record<string, unknown>[] | undefined {
    if (value === undefined || value === null || value === '') {
      return undefined;
    }
    if (!Array.isArray(value)) {
      throw new Error(`${field} must be a list.`);
    }
    const items = value.filter((item) => item !== undefined && item !== null);
    const records = items.filter(isPlainRecord);
    if (records.length !== items.length) {
      throw new Error(`${field} must be a list of objects.`);
    }
    return records.length === 0 ? undefined : records;
  },

  queryOrId({ query, id, idField }: { query: unknown; id: unknown; idField: string }): { query?: string; id?: string } {
    const text = moxieInput.text({ value: query });
    const exactId = moxieInput.optionalId({ value: id, field: idField });
    if (text === undefined && exactId === undefined) {
      throw new Error(`Enter a Query or a ${idField}.`);
    }
    return exactId === undefined ? { query: text } : { id: exactId };
  },

  compact({ values }: { values: Record<string, unknown> }): Record<string, unknown> {
    return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== undefined));
  },
};

export const moxieProps = {
  triState({ displayName, description }: { displayName: string; description?: string }) {
    return Property.StaticDropdown({
      displayName,
      description: description ?? 'Leave empty to not send this value (an update keeps the current one).',
      required: false,
      options: {
        disabled: false,
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    });
  },

  fromSpecs({ specs, audience }: { specs: MoxieFieldSpec[]; audience: MoxieAudience }) {
    const entries = specs.map((spec) => [spec.key, propFromSpec({ spec, audience })] as const);
    return Object.fromEntries(entries);
  },

  clearFields({ specs }: { specs: MoxieFieldSpec[] }) {
    const options = specs
      .filter((spec) => spec.clearable === true)
      .map((spec) => ({ label: spec.displayName, value: spec.key }));
    return Property.StaticMultiSelectDropdown({
      displayName: 'Clear Fields',
      description:
        'Fields to blank out on the record. Only text fields can be cleared; dates and numbers keep their value.',
      required: false,
      options: { disabled: false, options },
    });
  },
};

export const moxieBody = {
  fromSpecs({ specs, values }: { specs: MoxieFieldSpec[]; values: Record<string, unknown> }): Record<string, unknown> {
    const entries = specs.map((spec) => [spec.key, parseSpec({ spec, value: values[spec.key] })] as const);
    return moxieInput.compact({ values: Object.fromEntries(entries) });
  },

  withClears({
    specs,
    body,
    clearFields,
  }: {
    specs: MoxieFieldSpec[];
    body: Record<string, unknown>;
    clearFields: unknown;
  }): Record<string, unknown> {
    const requested = moxieInput.stringList({ value: clearFields, field: 'Clear Fields' }) ?? [];
    const clearable = new Set(specs.filter((spec) => spec.clearable === true).map((spec) => spec.key));
    const cleared: Record<string, string> = {};
    for (const key of requested) {
      if (!clearable.has(key)) {
        throw new Error(`"${key}" cannot be cleared. Clearable fields: ${[...clearable].join(', ')}.`);
      }
      if (body[key] !== undefined) {
        throw new Error(`"${key}" is both set and cleared. Pick one.`);
      }
      cleared[key] = '';
    }
    return { ...body, ...cleared };
  },

  requireChanges({ body, objectName }: { body: Record<string, unknown>; objectName: string }): void {
    if (Object.keys(body).length === 0) {
      throw new Error(`Nothing to update on the ${objectName}: set at least one field or pick a field to clear.`);
    }
  },
};

function propFromSpec({ spec, audience }: { spec: MoxieFieldSpec; audience: MoxieAudience }) {
  const required = spec.required === true;
  const description = spec.description;
  switch (spec.kind) {
    case 'longText':
      return Property.LongText({ displayName: spec.displayName, description, required });
    case 'number':
    case 'integer':
      return Property.Number({ displayName: spec.displayName, description, required });
    case 'date':
      return Property.ShortText({
        displayName: spec.displayName,
        description: description ?? 'Date in YYYY-MM-DD format.',
        required,
      });
    case 'dateTime':
      return audience === 'human'
        ? Property.DateTime({ displayName: spec.displayName, description, required })
        : Property.ShortText({
            displayName: spec.displayName,
            description: description ?? 'ISO 8601 date and time, for example 2026-10-01T09:30:00Z.',
            required,
          });
    case 'triState':
      return moxieProps.triState({ displayName: spec.displayName, description });
    case 'enum':
      return Property.StaticDropdown({
        displayName: spec.displayName,
        description,
        required,
        options: {
          disabled: false,
          options: (spec.options ?? []).map((option) => ({ label: option, value: option })),
        },
      });
    case 'list':
    case 'integerList':
      return Property.Array({ displayName: spec.displayName, description, required });
    case 'record':
      return Property.Object({ displayName: spec.displayName, description, required });
    case 'email':
    case 'id':
    case 'text':
      return Property.ShortText({ displayName: spec.displayName, description, required });
  }
}

function parseSpec({ spec, value }: { spec: MoxieFieldSpec; value: unknown }): unknown {
  const field = spec.displayName;
  const parsed = parseByKind({ spec, value, field });
  if (spec.required === true && parsed === undefined) {
    throw new Error(`${field} is required.`);
  }
  return parsed;
}

function parseByKind({ spec, value, field }: { spec: MoxieFieldSpec; value: unknown; field: string }): unknown {
  switch (spec.kind) {
    case 'text':
    case 'longText':
      return moxieInput.text({ value });
    case 'id':
      return moxieInput.optionalId({ value, field });
    case 'email':
      return moxieInput.email({ value, field });
    case 'number':
      return moxieInput.number({ value, field, min: spec.min });
    case 'integer':
      return moxieInput.integer({ value, field, min: spec.min });
    case 'date':
      return moxieInput.date({ value, field });
    case 'dateTime':
      return moxieInput.dateTime({ value, field });
    case 'triState':
      return moxieInput.triState({ value, field });
    case 'enum':
      return parseEnum({ value, field, options: spec.options ?? [] });
    case 'list':
      return moxieInput.stringList({ value, field });
    case 'integerList':
      return moxieInput.integerList({ value, field });
    case 'record':
      return moxieInput.record({ value, field });
  }
}

function parseEnum({ value, field, options }: { value: unknown; field: string; options: string[] }): string | undefined {
  const text = moxieInput.text({ value });
  if (text === undefined) {
    return undefined;
  }
  const match = options.find((option) => option.toLowerCase() === text.toLowerCase());
  if (match === undefined) {
    throw new Error(`${field} must be one of: ${options.join(', ')}. Got "${text}".`);
  }
  return match;
}

function isRealDate({ year, month, day }: { year: number; month: number; day: number }): boolean {
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export type MoxieAudience = 'ai' | 'human';

export type MoxieFieldKind =
  | 'text'
  | 'longText'
  | 'id'
  | 'email'
  | 'number'
  | 'integer'
  | 'date'
  | 'dateTime'
  | 'triState'
  | 'enum'
  | 'list'
  | 'integerList'
  | 'record';

export type MoxieFieldSpec = {
  key: string;
  kind: MoxieFieldKind;
  displayName: string;
  description?: string;
  required?: boolean;
  clearable?: boolean;
  min?: number;
  options?: string[];
};
