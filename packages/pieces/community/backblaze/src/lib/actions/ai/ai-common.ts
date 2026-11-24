import { backblazeCommon } from '../../common';

async function call<T>({
  request,
  operation,
  key,
}: {
  request: () => Promise<T>;
  operation: string;
  key?: string;
}): Promise<T> {
  try {
    return await request();
  } catch (error) {
    throw toActionError({ error, operation, key });
  }
}

function toActionError({
  error,
  operation,
  key,
}: {
  error: unknown;
  operation: string;
  key?: string;
}): Error {
  const { name, message, status, code } = backblazeCommon.readSdkError(error);
  const target = key ? ` "${key}"` : '';
  const detail = `${name}${message ? `: ${message}` : ''}`;
  if (name === 'NoSuchKey') {
    return new Error(`Backblaze ${operation}: file${target} does not exist in the bucket (${detail}).`);
  }
  if (name === 'NoSuchBucket') {
    return new Error(
      `Backblaze ${operation}: the connection's bucket was not found at this endpoint; check the bucket name and region (${detail}).`,
    );
  }
  if (name === 'NotFound' && status === 404) {
    return new Error(
      `Backblaze ${operation}: nothing was found for${target} (HTTP 404 with no error body; the file or the bucket may be missing).`,
    );
  }
  if (status === 412 || name === 'PreconditionFailed') {
    return new Error(
      `Backblaze ${operation}: a file already exists at${target} and overwriting was not allowed (${detail}).`,
    );
  }
  if (status === 401 || status === 403) {
    return new Error(
      `Backblaze ${operation}: access denied${target ? ` for${target}` : ''}; the application key may lack the needed capability or bucket access (${detail}).`,
    );
  }
  if (name === 'AbortError' || name === 'TimeoutError' || code === 'ETIMEDOUT' || code === 'ECONNRESET') {
    return new Error(
      `Backblaze ${operation}${target} did not complete (${detail}); a write may still have been applied.`,
    );
  }
  return new Error(`Backblaze ${operation}${target} failed (${detail}).`);
}

function isTextContentType(contentType: string | undefined): boolean {
  if (!contentType) {
    return false;
  }
  const type = contentType.toLowerCase();
  return type.startsWith('text/') || TEXT_TYPE_MARKERS.some((marker) => type.includes(marker));
}

function toIso(date: Date | undefined): string | null {
  return date ? date.toISOString() : null;
}

function copySource({ bucket, key }: { bucket: string; key: string }): string {
  return `${bucket}/${key.split('/').map(encodeURIComponent).join('/')}`;
}

function isMissing(error: unknown): boolean {
  const { name, status } = backblazeCommon.readSdkError(error);
  return name === 'NoSuchKey' || (name === 'NotFound' && status === 404);
}

const TEXT_TYPE_MARKERS = ['json', 'xml', 'csv', 'yaml', 'javascript', 'markdown', 'ndjson'];

export const backblazeAiCommon = { call, toActionError, isTextContentType, toIso, copySource, isMissing };
