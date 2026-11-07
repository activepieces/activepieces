import { OutputSchema, PieceAuth, Property } from '@activepieces/pieces-framework';
import type { EntityHandler } from '@base44/sdk';

async function getEntityHandler({
  auth,
  entityType,
}: {
  auth: Base44AuthValue;
  entityType: unknown;
}): Promise<EntityHandler<EntityRecordData>> {
  const { appId, token } = auth;
  if (!appId) {
    throw new Error('App ID is required.');
  }
  const name = requireText({ value: entityType, label: 'Entity type' });
  const { createClient } = await import('@base44/sdk');
  const client = createClient({ appId, token, serviceToken: token });
  const entities = token ? client.asServiceRole.entities : client.entities;
  return entities[name];
}

function requireText({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : '';
  if (!text) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

function readField({ source, key }: { source: unknown; key: string }): unknown {
  if (typeof source !== 'object' || source === null) {
    return undefined;
  }
  return Reflect.get(source, key);
}

function toBase44Error({
  error,
  entityType,
  operation,
}: {
  error: unknown;
  entityType: string;
  operation: string;
}): Error {
  const status = readField({ source: error, key: 'status' });
  const vendorMessage = readField({ source: error, key: 'message' });
  const trimmed = typeof vendorMessage === 'string' ? vendorMessage.replace(/[\s.!?;:,]+$/, '') : '';
  const detail = trimmed ? trimmed : 'Unknown error';
  if (typeof status !== 'number') {
    return new Base44ActionError({ message: `Failed to ${operation}: ${detail}`, responseBody: undefined });
  }
  const responseBody = readField({ source: error, key: 'data' });
  if (status === 401 || status === 403) {
    return new Base44ActionError({
      message: `Base44 rejected the credentials (HTTP ${status}): ${detail}. Check the App ID and API token.`,
      responseBody,
    });
  }
  if (status === 404) {
    return new Base44ActionError({
      message: `Not found (HTTP 404) while trying to ${operation}: ${detail}.${notFoundHint({ detail, entityType })}`,
      responseBody,
    });
  }
  return new Base44ActionError({ message: `Failed to ${operation} (HTTP ${status}): ${detail}`, responseBody });
}

function notFoundHint({ detail, entityType }: { detail: string; entityType: string }): string {
  const text = detail.toLowerCase();
  if (text.includes('entity schema')) {
    return ` Check the entity type name "${entityType}" (it is case-sensitive).`;
  }
  if (/\bapp\b/.test(text)) {
    return ' Check the App ID in the connection; it is the <id> in app.base44.com/apps/<id>/editor.';
  }
  if (/entity|record|not found/.test(text)) {
    return ` Check the entity type "${entityType}" and the record ID.`;
  }
  return '';
}

function toRecord(value: unknown): EntityRecordData {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).map(([key, field]) => [key, TIMESTAMP_KEYS.includes(key) ? normalizeTimestamp(field) : field]),
  );
}

function requireJsonObject({ value, label }: { value: unknown; label: string }): EntityRecordData {
  if (value === undefined || value === null) {
    return {};
  }
  const parsed = typeof value === 'string' ? parseJson({ text: value, label }) : value;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error(`${label} must be a JSON object, for example {"name": "Widget"}.`);
  }
  return { ...parsed };
}

function parseJson({ text, label }: { text: string; label: string }): unknown {
  if (!text.trim()) {
    return {};
  }
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${label} is not valid JSON. Use a JSON object, for example {"name": "Widget"}.`);
  }
}

function normalizeTimestamp(value: unknown): unknown {
  if (typeof value !== 'string' || !NAIVE_ISO_PATTERN.test(value)) {
    return value;
  }
  return `${value}Z`;
}

function toRecordList(value: unknown): EntityRecordData[] {
  return Array.isArray(value) ? value.map(toRecord) : [];
}

function toSortField(sort: string | undefined): string | undefined {
  const trimmed = sort?.trim();
  return trimmed ? trimmed : undefined;
}

function clampLimit({ limit, fallback }: { limit: number | undefined; fallback: number }): number {
  if (limit === undefined || limit === null || Number.isNaN(limit)) {
    return fallback;
  }
  return Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT);
}

function clampSkip(skip: number | undefined): number {
  if (skip === undefined || skip === null || Number.isNaN(skip)) {
    return 0;
  }
  return Math.max(Math.floor(skip), 0);
}

class Base44ActionError extends Error {
  responseBody: unknown;
  constructor({ message, responseBody }: { message: string; responseBody: unknown }) {
    super(message);
    this.name = 'Base44ActionError';
    this.responseBody = responseBody;
  }
}

const recordFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Record ID', description: 'Built-in record ID. Records also include every app-defined field of the entity (e.g. name, status) as top-level keys, referenced by their field name.' },
  { key: 'created_date', label: 'Created Date', format: 'datetime' },
  { key: 'updated_date', label: 'Updated Date', format: 'datetime' },
  { key: 'created_by_id', label: 'Created By ID' },
  { key: 'is_sample', label: 'Is Sample', format: 'boolean' },
];

const recordOutputSchema: OutputSchema = { fields: recordFields };

const base44Auth = PieceAuth.CustomAuth({
  description: `Authenticate with your Base44 app using your App ID and API token.

**App ID**: Your Base44 application ID (required)
**Token**: Your Base44 service token (optional). When set, requests run with the service role (admin access to all app data); without it only publicly readable data is available.

You can find these in your Base44 app settings or dashboard.`,
  displayName: 'Authentication',
  required: true,
  props: {
    appId: Property.ShortText({
      displayName: 'App ID',
      description: 'Your Base44 application ID',
      required: true,
    }),
    token: PieceAuth.SecretText({
      displayName: 'API Token',
      description: 'Your Base44 service token. Leave empty to access only public app data.',
      required: false,
    }),
  },
  validate: async ({ auth }) => {
    if (!auth.token?.trim()) {
      return { valid: true };
    }
    try {
      const handler = await getEntityHandler({ auth, entityType: VALIDATION_ENTITY });
      await handler.list(undefined, 1);
      return { valid: true };
    } catch (error: unknown) {
      return {
        valid: false,
        error: toBase44Error({ error, entityType: VALIDATION_ENTITY, operation: 'verify the connection' }).message,
      };
    }
  },
});

const VALIDATION_ENTITY = 'User';
const TIMESTAMP_KEYS = ['created_date', 'updated_date'];
const NAIVE_ISO_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/;
const MAX_LIMIT = 500;
const DEFAULT_LIMIT = 50;

type EntityRecordData = Record<string, unknown>;

type Base44AuthValue = { appId: string; token?: string };

export const base44Common = {
  getEntityHandler,
  requireText,
  toBase44Error,
  toRecord,
  requireJsonObject,
  normalizeTimestamp,
  toRecordList,
  toSortField,
  clampLimit,
  clampSkip,
  readField,
  recordFields,
  recordOutputSchema,
  MAX_LIMIT,
  DEFAULT_LIMIT,
};
export { Base44ActionError, base44Auth };
export type { EntityRecordData, Base44AuthValue };
