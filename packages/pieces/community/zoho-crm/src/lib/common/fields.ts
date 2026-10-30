import { InputPropertyMap, Property } from '@activepieces/pieces-framework';
import { ZohoCrmError, parseJsonObject, requireId, stringList } from './client';
import { ZohoField } from './metadata';

const SKIPPED_TYPES = new Set([
  'subform',
  'fileupload',
  'imageupload',
  'profileimage',
  'formula',
  'autonumber',
  'event_reminder',
  'RRULE',
  'ALARM',
  'multiselectlookup',
  'multiuserlookup',
  'consent_lookup',
  'rollup_summary',
]);

const NUMBER_TYPES = new Set(['integer', 'double', 'decimal', 'currency', 'percent']);
const BIG_INTEGER_TYPES = new Set(['bigint', 'long']);
const LOOKUP_TYPES = new Set(['lookup', 'ownerlookup', 'userlookup']);
const SYSTEM_FIELDS = new Set(['id', 'Created_Time', 'Modified_Time', 'Created_By', 'Modified_By', 'Last_Activity_Time', 'Tag']);

export function isApiReadOnly(field: ZohoField): boolean {
  if (field.read_only === true) return true;
  const apiWritableOwner = field.data_type === 'ownerlookup' && field.api_name === 'Owner';
  return field.field_read_only === true && !apiWritableOwner;
}

function isWritableField(field: ZohoField): boolean {
  if (!field.api_name || SYSTEM_FIELDS.has(field.api_name) || field.api_name.startsWith('$')) {
    return false;
  }
  if (isApiReadOnly(field) || field.visible === false) {
    return false;
  }
  return !SKIPPED_TYPES.has(field.data_type ?? '');
}

function labelOf(field: ZohoField): string {
  return field.display_label ?? field.field_label ?? field.api_name;
}

function picklistOptions(field: ZohoField): { label: string; value: string }[] {
  return (field.pick_list_values ?? []).flatMap((p) => {
    const value = p.actual_value;
    if (typeof value !== 'string' || value === '-None-') {
      return [];
    }
    return [{ label: p.display_value ?? value, value }];
  });
}

export function buildFieldProps({ fields, mode }: { fields: ZohoField[]; mode: FieldMode }): InputPropertyMap {
  const props: InputPropertyMap = {};
  for (const field of fields.filter(isWritableField)) {
    const required = mode === 'create' && field.system_mandatory === true;
    const displayName = labelOf(field);
    const type = field.data_type ?? 'text';
    const base = `API name: ${field.api_name}.`;
    if (NUMBER_TYPES.has(type)) {
      props[field.api_name] = Property.Number({ displayName, description: base, required });
    } else if (BIG_INTEGER_TYPES.has(type)) {
      props[field.api_name] = Property.ShortText({ displayName, description: `${base} Whole number, up to 18 digits.`, required });
    } else if (type === 'boolean') {
      props[field.api_name] = Property.StaticDropdown({
        displayName,
        description: `${base} Leave empty to ${mode === 'update' ? 'keep the current value' : 'use the Zoho default'}.`,
        required,
        options: { options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
      });
    } else if (type === 'date') {
      props[field.api_name] = Property.ShortText({ displayName, description: `${base} Date as yyyy-MM-dd, e.g. 2026-10-01.`, required });
    } else if (type === 'datetime') {
      props[field.api_name] = Property.DateTime({ displayName, description: `${base} Sent as ISO 8601 with offset.`, required });
    } else if (type === 'picklist') {
      props[field.api_name] = Property.StaticDropdown({
        displayName,
        description: base,
        required,
        options: { options: picklistOptions(field) },
      });
    } else if (type === 'multiselectpicklist') {
      props[field.api_name] = Property.StaticMultiSelectDropdown({
        displayName,
        description: `${base} Selected values replace the current ones.`,
        required,
        options: { options: picklistOptions(field) },
      });
    } else if (LOOKUP_TYPES.has(type)) {
      const target = type === 'lookup' ? field.lookup?.module?.api_name ?? 'the related module' : 'Users';
      props[field.api_name] = Property.ShortText({
        displayName,
        description: `${base} Id of a record in ${target}.`,
        required,
      });
    } else if (type === 'textarea') {
      props[field.api_name] = Property.LongText({ displayName, description: base, required });
    } else {
      props[field.api_name] = Property.ShortText({ displayName, description: base, required });
    }
  }
  return props;
}

export function fieldsJsonFallbackProp({ reason, mode }: { reason: string; mode: FieldMode }): InputPropertyMap {
  return {
    [FIELDS_JSON_KEY]: Property.Json({
      displayName: 'Fields',
      description: `The field list could not be loaded (${reason}). Enter a JSON object of field API names and values, e.g. {"Last_Name": "Doe", "Email": "jane@example.com"}.`,
      required: mode === 'create',
      defaultValue: {},
    }),
  };
}

function isBlank(value: unknown): boolean {
  return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0);
}

function toDate({ value, api }: { value: unknown; api: string }): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})?)?$/.exec(String(value).trim());
  const date = match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : undefined;
  if (!match || !date || date.getUTCMonth() !== Number(match[2]) - 1 || date.getUTCDate() !== Number(match[3])) {
    throw new ZohoCrmError(`${api} must be a date as yyyy-MM-dd, e.g. 2026-10-01.`);
  }
  return `${match[1]}-${match[2]}-${match[3]}`;
}

function toBigInteger({ value, api }: { value: unknown; api: string }): string {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) {
      throw new ZohoCrmError(`${api} arrived as a number above 2^53, which is already rounded; pass long integers above 2^53 as text (the exact digits).`);
    }
    return String(value);
  }
  const digits = String(value).trim();
  if (!/^-?\d{1,18}$/.test(digits)) {
    throw new ZohoCrmError(`${api} must be a whole number of at most 18 digits.`);
  }
  return digits;
}

function toDateTime({ value, api }: { value: unknown; api: string }): string {
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/.test(s)) {
    return s;
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    throw new ZohoCrmError(`${api} must be an ISO 8601 date-time such as 2026-10-01T09:00:00+02:00.`);
  }
  return d.toISOString().replace(/\.\d{3}Z$/, '+00:00');
}

function toBoolean({ value, api }: { value: unknown; api: string }): boolean {
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new ZohoCrmError(`${api} must be true or false.`);
}

function toNumber({ value, api }: { value: unknown; api: string }): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) {
    throw new ZohoCrmError(`${api} must be a number.`);
  }
  if (typeof value === 'string' && !isExactDecimal({ text: value.trim(), n })) {
    throw new ZohoCrmError(`${api} has more digits than can be sent exactly (${value.trim()}); use at most 15 significant digits.`);
  }
  return n;
}

function isExactDecimal({ text, n }: { text: string; n: number }): boolean {
  const match = /^([+-]?)(\d*)(?:\.(\d*))?$/.exec(text);
  if (!match) {
    return true;
  }
  const whole = match[2].replace(/^0+/, '');
  const fraction = (match[3] ?? '').replace(/0+$/, '');
  if ((whole + fraction).replace(/^0+/, '').length <= MAX_EXACT_DIGITS) {
    return true;
  }
  const canonical = `${match[1] === '-' ? '-' : ''}${whole || '0'}${fraction ? `.${fraction}` : ''}`;
  return String(n) === canonical;
}

const MAX_EXACT_DIGITS = 15;

export function convertFieldValue({ field, value }: { field: ZohoField | undefined; value: unknown }): unknown {
  if (!field) {
    return value;
  }
  const type = field.data_type ?? '';
  const api = field.api_name;
  if (NUMBER_TYPES.has(type)) return toNumber({ value, api });
  if (BIG_INTEGER_TYPES.has(type)) return toBigInteger({ value, api });
  if (type === 'boolean') return toBoolean({ value, api });
  if (type === 'date') return toDate({ value, api });
  if (type === 'datetime') return toDateTime({ value, api });
  if (type === 'multiselectpicklist') {
    return stringList(value);
  }
  if (LOOKUP_TYPES.has(type)) {
    if (typeof value === 'object' && value !== null) return value;
    return { id: requireId({ value, name: api }) };
  }
  return value;
}

export function buildRecordPayload({
  dynamicValues,
  fields,
  extraFields,
  clearFields,
}: {
  dynamicValues: Record<string, unknown> | undefined;
  fields: ZohoField[] | undefined;
  extraFields?: unknown;
  clearFields?: string[];
}): Record<string, unknown> {
  const byName = new Map((fields ?? []).map((f) => [f.api_name, f]));
  const { [FIELDS_JSON_KEY]: fallback, ...values } = dynamicValues ?? {};
  const formValues = Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => !isBlank(value))
      .map(([key, value]) => [key, convertFieldValue({ field: byName.get(key), value })]),
  );
  const cleared = Object.fromEntries((clearFields ?? []).map((key) => [key, null]));
  return {
    ...parseJsonObject({ value: extraFields, name: 'Additional fields' }),
    ...parseJsonObject({ value: fallback, name: 'Fields' }),
    ...formValues,
    ...cleared,
  };
}

export const FIELDS_JSON_KEY = '__fields_json';

export type FieldMode = 'create' | 'update' | 'upsert';
