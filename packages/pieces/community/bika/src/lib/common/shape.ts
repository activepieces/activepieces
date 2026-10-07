import { bikaClient, BikaField, bikaHelpers, BikaRecord } from './client';
import { BIKA_READ_ONLY_FIELD_TYPES, BIKA_WRITE_FORMATS } from './constants';

const MAX_TEXT_LENGTH = 4_000;
const MAX_ARRAY_ITEMS = 100;

export const bikaShape = {
  requireId,
  optionalText,
  parseFieldsJson,
  agentRecord,
  agentRecords,
  agentField,
  cleanHumanFields,
  uploadFiles,
  MAX_TEXT_LENGTH,
};

function requireId({ value, label }: { value: unknown; label: string }): string {
  return bikaHelpers.seg({ value, label });
}

function optionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseFieldsJson({ value, label }: { value: unknown; label: string }): Record<string, unknown> {
  const parsed = typeof value === 'string' ? parseJson({ text: value, label }) : value;
  if (!bikaHelpers.isRecord(parsed)) {
    throw new Error(`${label} must be a JSON object keyed by field name, for example {"Name": "Ada", "Score": 5}.`);
  }
  const entries = Object.entries(parsed).filter(([key, fieldValue]) => key.trim().length > 0 && fieldValue !== undefined);
  if (entries.length === 0) {
    throw new Error(`${label} is empty. Add at least one field value.`);
  }
  return Object.fromEntries(entries);
}

function agentRecord({ record, databaseId }: { record: BikaRecord; databaseId: string }) {
  const capped = capFields(record.fields);
  return {
    record: {
      id: record.id,
      database_id: databaseId,
      created_at: record.createdAt ?? null,
      updated_at: record.updatedAt ?? null,
      fields: capped.fields,
    },
    truncatedFields: capped.truncated,
  };
}

function agentRecords({ records, databaseId }: { records: BikaRecord[]; databaseId: string }) {
  const shaped = records.map((record) => agentRecord({ record, databaseId }));
  const truncated = new Set<string>();
  for (const item of shaped) {
    for (const name of item.truncatedFields) {
      truncated.add(name);
    }
  }
  return { records: shaped.map((item) => item.record), truncatedFields: [...truncated] };
}

function agentField(field: BikaField) {
  const writable = !BIKA_READ_ONLY_FIELD_TYPES.includes(field.type) && BIKA_WRITE_FORMATS[field.type] !== undefined;
  return {
    id: field.id,
    name: field.name,
    type: field.type,
    primary: field.primary,
    writable,
    value_format: writable ? BIKA_WRITE_FORMATS[field.type] : BIKA_READ_ONLY_FIELD_TYPES.includes(field.type) ? 'read-only' : 'not supported by these actions',
    options: field.options.map((option) => option.name),
    description: optionalText(field.description) ?? null,
  };
}

function cleanHumanFields(fields: unknown): Record<string, unknown> {
  if (!bikaHelpers.isRecord(fields)) {
    return {};
  }
  for (const [name, value] of Object.entries(fields)) {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new Error(`The value for "${name}" is not a valid number.`);
    }
  }
  return Object.fromEntries(
    Object.entries(fields).filter(([, value]) => {
      if (value === undefined || value === null) {
        return false;
      }
      if (typeof value === 'string') {
        return value.length > 0;
      }
      if (Array.isArray(value)) {
        return value.length > 0;
      }
      return true;
    }),
  );
}

async function uploadFiles({ token, spaceId, fields }: { token: string; spaceId: string; fields: Record<string, unknown> }): Promise<Record<string, unknown>> {
  const result: Record<string, unknown> = {};
  for (const [name, value] of Object.entries(fields)) {
    const files = fileList(value);
    if (files === null) {
      result[name] = value;
      continue;
    }
    const uploaded = [];
    for (const file of files) {
      const attachment = await bikaClient.uploadAttachment({ token, spaceId, file });
      uploaded.push({ id: attachment.id, name: file.filename });
    }
    result[name] = uploaded;
  }
  return result;
}

function fileList(value: unknown): { filename: string; data: Buffer }[] | null {
  if (isFile(value)) {
    return [{ filename: value.filename, data: value.data }];
  }
  if (Array.isArray(value) && value.length > 0 && value.every(isFile)) {
    return value.map((file) => ({ filename: file.filename, data: file.data }));
  }
  return null;
}

function isFile(value: unknown): value is { filename: string; data: Buffer } {
  return bikaHelpers.isRecord(value) && typeof value['filename'] === 'string' && Buffer.isBuffer(value['data']);
}

function capFields(fields: Record<string, unknown>): { fields: Record<string, unknown>; truncated: string[] } {
  const truncated: string[] = [];
  const capped = Object.fromEntries(
    Object.entries(fields).map(([name, value]) => {
      const result = capValue(value);
      if (result.truncated) {
        truncated.push(name);
      }
      return [name, result.value];
    }),
  );
  return { fields: capped, truncated };
}

function capValue(value: unknown): { value: unknown; truncated: boolean } {
  if (typeof value === 'string') {
    return value.length > MAX_TEXT_LENGTH ? { value: value.slice(0, MAX_TEXT_LENGTH), truncated: true } : { value, truncated: false };
  }
  if (Array.isArray(value)) {
    const results = value.slice(0, MAX_ARRAY_ITEMS).map((item) => (isAttachment(item) ? { value: shapeAttachment(item), truncated: false } : capValue(item)));
    return {
      value: results.map((result) => result.value),
      truncated: value.length > MAX_ARRAY_ITEMS || results.some((result) => result.truncated),
    };
  }
  if (bikaHelpers.isRecord(value)) {
    const results = Object.entries(value).map(([key, item]) => ({ key, result: capValue(item) }));
    return {
      value: Object.fromEntries(results.map(({ key, result }) => [key, result.value])),
      truncated: results.some(({ result }) => result.truncated),
    };
  }
  return { value, truncated: false };
}

function isAttachment(value: unknown): value is Record<string, unknown> {
  return bikaHelpers.isRecord(value) && typeof value['id'] === 'string' && typeof value['mimeType'] === 'string';
}

function shapeAttachment(value: Record<string, unknown>) {
  return {
    id: value['id'],
    name: typeof value['name'] === 'string' ? value['name'] : null,
    mime_type: value['mimeType'],
    size: typeof value['size'] === 'number' ? value['size'] : null,
    url: typeof value['url'] === 'string' ? value['url'] : null,
  };
}

function parseJson({ text, label }: { text: string; label: string }): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} is not valid JSON.`);
  }
}
