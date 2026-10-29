import { HttpMethod } from '@activepieces/pieces-common';
import { cognitoRequest, encodeSegment, isRecord } from './client';


export async function listForms(apiKey: string): Promise<CognitoForm[]> {
  const body = await cognitoRequest<unknown>({ apiKey, method: HttpMethod.GET, path: '/forms' });
  if (!Array.isArray(body)) {
    return [];
  }
  return body.filter(isRecord).map((form) => ({
    Id: readString(form['Id']),
    Name: readString(form['Name']),
    InternalName: readString(form['InternalName']),
  }));
}

export function formPath(formId: string): string {
  return `/forms/${encodeSegment(requireText({ value: formId, label: 'Form' }))}`;
}

export function entryPath({ formId, entryId }: { formId: string; entryId: string | number }): string {
  return `${formPath(formId)}/entries/${encodeSegment(requireText({ value: String(entryId), label: 'Entry ID' }))}`;
}

export function requireText({ value, label }: { value: string | undefined | null; label: string }): string {
  const trimmed = (value ?? '').trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return trimmed;
}

export function stripEmptyValues(values: Record<string, unknown> | undefined | null): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(values ?? {})) {
    if (value === undefined || value === null) {
      continue;
    }
    if (typeof value === 'string' && value.trim() === '') {
      continue;
    }
    if (Array.isArray(value) && value.length === 0) {
      continue;
    }
    if (isRecord(value) && Object.keys(value).length === 0) {
      continue;
    }
    result[key] = value;
  }
  return result;
}

export function parseFieldsObject(value: unknown): Record<string, unknown> {
  const parsed = typeof value === 'string' ? safeJsonParse(value) : value;
  if (!isRecord(parsed)) {
    throw new Error('Fields must be a JSON object that maps field names to values, for example {"Name": {"First": "Ada", "Last": "Lovelace"}, "Email": "ada@example.com"}.');
  }
  return parsed;
}

function safeJsonParse(value: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    throw new Error('Fields is not valid JSON.');
  }
}

export const ENTRY_META_KEYS = new Set(['Id', 'Form', 'Entry', '$type', '$etag', '$version']);

export function normalizeEntry(raw: unknown): NormalizedEntry {
  const entry = isRecord(raw) ? raw : {};
  const meta = isRecord(entry['Entry']) ? entry['Entry'] : {};
  const form = isRecord(entry['Form']) ? entry['Form'] : {};
  const fields: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(entry)) {
    if (!ENTRY_META_KEYS.has(key)) {
      fields[key] = value;
    }
  }
  return {
    entry_id: readString(entry['Id']) ?? null,
    entry_number: readNumber(meta['Number']) ?? null,
    status: readString(meta['Status']) ?? null,
    version: readNumber(meta['Version']) ?? null,
    date_created: readString(meta['DateCreated']) ?? null,
    date_submitted: readString(meta['DateSubmitted']) ?? null,
    date_updated: readString(meta['DateUpdated']) ?? null,
    admin_link: readString(meta['AdminLink']) ?? null,
    public_link: readString(meta['PublicLink']) ?? null,
    internal_link: readString(meta['InternalLink']) ?? null,
    form_id: readString(form['Id']) ?? null,
    form_name: readString(form['Name']) ?? null,
    fields,
  };
}

export type NormalizedEntry = {
  entry_id: string | null;
  entry_number: number | null;
  status: string | null;
  version: number | null;
  date_created: string | null;
  date_submitted: string | null;
  date_updated: string | null;
  admin_link: string | null;
  public_link: string | null;
  internal_link: string | null;
  form_id: string | null;
  form_name: string | null;
  fields: Record<string, unknown>;
};

export function readString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return String(value);
  }
  return undefined;
}

function readNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return undefined;
}

export type CognitoForm = { Id?: string; Name?: string; InternalName?: string };
