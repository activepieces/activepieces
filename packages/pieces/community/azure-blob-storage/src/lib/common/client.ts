import { Property } from '@activepieces/pieces-framework';
import type {
  BlobItem,
  BlobServiceClient,
  ContainerItem,
} from '@azure/storage-blob';

async function loadSdk(): Promise<typeof import('@azure/storage-blob')> {
  return import('@azure/storage-blob');
}

async function getServiceClient({
  connectionString,
}: {
  connectionString: string;
}): Promise<BlobServiceClient> {
  const sdk = await loadSdk();
  return sdk.BlobServiceClient.fromConnectionString(connectionString.trim());
}

function toIso(date: Date | undefined | null): string | null {
  if (!date) {
    return null;
  }
  const time = date.getTime();
  return Number.isFinite(time) ? date.toISOString() : null;
}

function validateTags({ tags }: { tags: unknown }): Record<string, string> {
  if (tags === undefined || tags === null) {
    return {};
  }
  if (typeof tags !== 'object' || Array.isArray(tags)) {
    throw new Error('Tags must be an object of key/value text pairs.');
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(tags)) {
    if (
      key.length < 1 ||
      key.length > MAX_TAG_KEY_LENGTH ||
      !TAG_CHARACTERS.test(key)
    ) {
      throw new Error(
        `Tag key "${key}" is invalid: use 1-${MAX_TAG_KEY_LENGTH} characters from letters, digits, space and + - . / : = _`
      );
    }
    let text: string;
    if (typeof value === 'string') {
      text = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      text = String(value);
    } else {
      throw new Error(
        `Tag "${key}" must have a text value; nested objects, lists and empty values are not allowed.`
      );
    }
    if (
      text.length > MAX_TAG_VALUE_LENGTH ||
      (text !== '' && !TAG_CHARACTERS.test(text))
    ) {
      throw new Error(
        `Tag "${key}" has an invalid value: use up to ${MAX_TAG_VALUE_LENGTH} characters from letters, digits, space and + - . / : = _`
      );
    }
    result[key] = text;
  }
  if (Object.keys(result).length > MAX_TAGS) {
    throw new Error(
      `Azure allows at most ${MAX_TAGS} tags per blob; ${
        Object.keys(result).length
      } were given.`
    );
  }
  return result;
}

function validateMetadata({
  metadata,
}: {
  metadata: unknown;
}): Record<string, string> {
  if (metadata === undefined || metadata === null) {
    return {};
  }
  if (typeof metadata !== 'object' || Array.isArray(metadata)) {
    throw new Error('Metadata must be an object of key/value text pairs.');
  }
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (!METADATA_KEY_PATTERN.test(key)) {
      throw new Error(
        `Metadata key "${key}" is invalid: use letters, digits and underscores, starting with a letter or underscore.`
      );
    }
    if (typeof value === 'string') {
      result[key] = value;
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      result[key] = String(value);
    } else {
      throw new Error(`Metadata "${key}" must have a text value.`);
    }
  }
  return result;
}

function escapeTagValue(value: string): string {
  return value.replace(/'/g, "''");
}

function escapeTagKey(key: string): string {
  return key.replace(/"/g, '""');
}

function buildTagFilter({
  tags,
  container,
}: {
  tags: Record<string, string>;
  container?: string;
}): string {
  const conditions = Object.entries(tags).map(
    ([key, value]) => `"${escapeTagKey(key)}"='${escapeTagValue(value)}'`
  );
  if (container) {
    conditions.unshift(`@container='${escapeTagValue(container)}'`);
  }
  if (conditions.length === 0) {
    throw new Error('Provide at least one tag to search by.');
  }
  return conditions.join(' AND ');
}

function readErrorField({
  error,
  field,
}: {
  error: object;
  field: string;
}): unknown {
  return field in error ? Reflect.get(error, field) : undefined;
}

function redactSas(text: string): string {
  return text.replace(/([?&]sig=)[^&\s"']+/gi, '$1REDACTED');
}

function mapAzureError({
  error,
  operation,
  isWrite,
  notFoundMessage,
}: {
  error: unknown;
  operation: string;
  isWrite: boolean;
  notFoundMessage?: string;
}): Error {
  if (typeof error !== 'object' || error === null) {
    return new Error(
      `Azure Blob ${operation} failed: ${redactSas(String(error))}`
    );
  }
  const statusCode = readErrorField({ error, field: 'statusCode' });
  const code = readErrorField({ error, field: 'code' });
  const rawMessage = readErrorField({ error, field: 'message' });
  const message =
    typeof rawMessage === 'string'
      ? redactSas(rawMessage.split('\n')[0].trim())
      : '';
  const codeText = typeof code === 'string' && code !== '' ? code : null;
  if (codeText === 'BlobArchived') {
    return new Error(
      `Azure Blob ${operation} failed: BlobArchived ${
        message ? `${message} ` : ''
      }The blob is in the Archive tier: set the access tier to Hot, Cool or Cold and wait for rehydration (can take hours) before reading.`
    );
  }
  if (codeText === 'AuthorizationPermissionMismatch') {
    return new Error(
      `Azure Blob ${operation} failed: AuthorizationPermissionMismatch ${
        message ? `${message} ` : ''
      }The connection's SAS does not grant this operation: regenerate it with the needed permission (Write, Delete, Create, Tag) or use an account-key connection string.`
    );
  }
  if (statusCode === 404 && codeText === null && notFoundMessage) {
    return new Error(`Azure Blob ${operation} failed: ${notFoundMessage}`);
  }
  if (typeof statusCode === 'number') {
    const label = codeText ?? `HTTP ${statusCode}`;
    return new Error(
      `Azure Blob ${operation} failed: ${label}${message ? ` ${message}` : ''}`
    );
  }
  const suffix = isWrite ? ' The change may still have been applied.' : '';
  return new Error(
    `Azure Blob ${operation} failed: ${codeText ?? 'network error'}${
      message ? ` ${message}` : ''
    }.${suffix}`
  );
}

async function callAzure<T>({
  operation,
  isWrite,
  request,
  notFoundMessage,
}: {
  operation: string;
  isWrite: boolean;
  request: () => Promise<T>;
  notFoundMessage?: string;
}): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw mapAzureError({ error, operation, isWrite, notFoundMessage });
  }
}

function clampMaxResults({
  value,
  fallback,
}: {
  value: number | undefined | null;
  fallback: number;
}): number {
  if (value === undefined || value === null || !Number.isFinite(value)) {
    return fallback;
  }
  const rounded = Math.floor(value);
  if (rounded < 1 || rounded > MAX_RESULTS_LIMIT) {
    throw new Error(`Max Results must be between 1 and ${MAX_RESULTS_LIMIT}.`);
  }
  return rounded;
}

function emptyToUndefined(
  value: string | undefined | null
): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return value.trim() === '' ? undefined : value;
}

function stripUrlSecrets(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.search = '';
    parsed.hash = '';
    return parsed.toString();
  } catch {
    const cut = url.search(/[?#]/);
    return cut < 0 ? url : url.slice(0, cut);
  }
}

function toStringMap(value: unknown): Record<string, string> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }
  const result: Record<string, string> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'string') {
      result[key] = entry;
    }
  }
  return result;
}

function mapContainerItem(container: ContainerItem): ContainerSummary {
  return {
    name: container.name,
    lastModified: toIso(container.properties.lastModified),
    etag: container.properties.etag ?? null,
    publicAccess: container.properties.publicAccess ?? null,
    leaseState: container.properties.leaseState ?? null,
    deleted: container.deleted ?? false,
    metadata: toStringMap(container.metadata),
  };
}

function mapBlobItem(blob: BlobItem): BlobSummary {
  return {
    name: blob.name,
    size: blob.properties.contentLength ?? null,
    contentType: blob.properties.contentType ?? null,
    lastModified: toIso(blob.properties.lastModified),
    createdOn: toIso(blob.properties.createdOn),
    etag: blob.properties.etag ?? null,
    accessTier: blob.properties.accessTier ?? null,
    blobType: blob.properties.blobType ?? null,
    versionId: blob.versionId ?? null,
    snapshot: blob.snapshot === '' ? null : blob.snapshot ?? null,
    metadata: toStringMap(blob.metadata),
  };
}

function containerNameProp() {
  return Property.ShortText({
    displayName: 'Container Name',
    description:
      'The container name exactly as returned by List Containers, e.g. "invoices".',
    required: true,
  });
}

function blobNameProp() {
  return Property.ShortText({
    displayName: 'Blob Name',
    description:
      'The full blob name (path) inside the container, e.g. "reports/2024/q1.csv", as returned by List Blobs.',
    required: true,
  });
}

function maxResultsProp() {
  return Property.Number({
    displayName: 'Max Results',
    description: 'How many items to return in this call (1-1000, default 50).',
    required: false,
    defaultValue: DEFAULT_MAX_RESULTS,
  });
}

function continuationTokenProp() {
  return Property.ShortText({
    displayName: 'Continuation Token',
    description:
      'The nextContinuationToken from a previous call, to fetch the next page. Leave empty for the first page.',
    required: false,
  });
}

function contentTypeFromName({
  names,
}: {
  names: (string | null | undefined)[];
}): string {
  for (const name of names) {
    if (!name) {
      continue;
    }
    const dot = name.lastIndexOf('.');
    if (dot < 0 || dot === name.length - 1) {
      continue;
    }
    const type = CONTENT_TYPES[name.slice(dot + 1).toLowerCase()];
    if (type) {
      return type;
    }
  }
  return 'application/octet-stream';
}

const CONTENT_TYPES: Record<string, string> = {
  txt: 'text/plain; charset=utf-8',
  csv: 'text/csv; charset=utf-8',
  json: 'application/json',
  html: 'text/html; charset=utf-8',
  xml: 'application/xml',
  md: 'text/markdown; charset=utf-8',
  pdf: 'application/pdf',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml',
  zip: 'application/zip',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
};
const MAX_TAGS = 10;
const MAX_TAG_KEY_LENGTH = 128;
const MAX_TAG_VALUE_LENGTH = 256;
const TAG_CHARACTERS = /^[A-Za-z0-9 +\-./:=_]+$/;
const DEFAULT_MAX_RESULTS = 50;
const MAX_RESULTS_LIMIT = 1000;
const METADATA_KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

export const azureBlobCommon = {
  loadSdk,
  getServiceClient,
  toIso,
  validateTags,
  validateMetadata,
  buildTagFilter,
  mapAzureError,
  callAzure,
  clampMaxResults,
  toStringMap,
  stripUrlSecrets,
  contentTypeFromName,
  mapContainerItem,
  mapBlobItem,
  emptyToUndefined,
  MAX_RESULTS_LIMIT,
  DEFAULT_MAX_RESULTS,
};

export const azureBlobAiProps = {
  containerName: containerNameProp,
  blobName: blobNameProp,
  maxResults: maxResultsProp,
  continuationToken: continuationTokenProp,
};

export type ContainerSummary = {
  name: string;
  lastModified: string | null;
  etag: string | null;
  publicAccess: string | null;
  leaseState: string | null;
  deleted: boolean;
  metadata: Record<string, string>;
};

export type BlobSummary = {
  name: string;
  size: number | null;
  contentType: string | null;
  lastModified: string | null;
  createdOn: string | null;
  etag: string | null;
  accessTier: string | null;
  blobType: string | null;
  versionId: string | null;
  snapshot: string | null;
  metadata: Record<string, string>;
};
