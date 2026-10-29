import { Readable } from 'node:stream';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { isRecord } from './client';
import { mindeeNetwork } from './network-guard';

function readFileProp({ value, label }: { value: unknown; label: string }): MindeeUpload {
  if (!isRecord(value)) {
    throw new Error(`${label} is required. Pick a file or map one from an earlier step.`);
  }
  const data = value['data'];
  const filename = typeof value['filename'] === 'string' && value['filename'].trim().length > 0 ? value['filename'].trim() : 'document';
  if (Buffer.isBuffer(data)) {
    return checkSize({ data, filename, label });
  }
  const base64 = Reflect.get(value, 'base64');
  if (typeof base64 === 'string' && base64.length > 0) {
    return checkSize({ data: Buffer.from(base64, 'base64'), filename, label });
  }
  throw new Error(`${label} could not be read. Pick a file or map one from an earlier step.`);
}

function parseHttpsUrl({ value, label, allowHttp = false }: { value: string | undefined; label: string; allowHttp?: boolean }): URL {
  const trimmed = (value ?? '').trim();
  if (trimmed.length === 0) {
    throw new Error(`${label} is required.`);
  }
  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`${label} must be a full URL starting with https://.`);
  }
  if (url.protocol !== 'https:' && !(allowHttp && url.protocol === 'http:')) {
    throw new Error(`${label} must start with https://${allowHttp ? ' or http://' : ''}.`);
  }
  if (url.username !== '' || url.password !== '') {
    throw new Error(`${label} must not contain a user name or password.`);
  }
  return url;
}

async function downloadFile({ url, label, timeoutMs = DOWNLOAD_TIMEOUT_MS }: { url: URL; label: string; timeoutMs?: number }): Promise<MindeeUpload> {
  const { response, finalUrl } = await followSafely({ url, label, timeoutMs });
  const declared = Number(response.headers?.['content-length'] ?? '');
  if (Number.isFinite(declared) && declared > MAX_FILE_BYTES) {
    response.body.destroy();
    throw new Error(`${label} is larger than ${MAX_FILE_MB} MB, which Mindee does not accept.`);
  }
  const data = await readCapped({ stream: response.body, label, timeoutMs });
  if (data.length === 0) {
    throw new Error(`${label} returned an empty file.`);
  }
  return { data, filename: filenameFromUrl(finalUrl) };
}

async function followSafely({ url, label, timeoutMs }: { url: URL; label: string; timeoutMs: number }) {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    await assertSafeTarget({ url: current, label });
    const response = await requestDownload({ url: current, label, timeoutMs });
    if (response.status < 300 || response.status >= 400) {
      return { response, finalUrl: current };
    }
    response.body?.destroy();
    const location = headerValue(response.headers?.['location']);
    if (location === undefined) {
      throw new Error(`Could not download ${label}: the server answered HTTP ${response.status} without a redirect location.`);
    }
    try {
      current = new URL(location, current);
    } catch {
      throw new Error(`Could not download ${label}: the server redirected to an invalid URL.`);
    }
  }
  throw new Error(`Could not download ${label}: more than ${MAX_REDIRECTS} redirects.`);
}

async function assertSafeTarget({ url, label }: { url: URL; label: string }): Promise<void> {
  if (url.protocol !== 'https:') {
    throw new Error(`${label} must use https:// (redirects to other schemes are not followed).`);
  }
  if (url.username !== '' || url.password !== '') {
    throw new Error(`${label} must not contain a user name or password.`);
  }
  try {
    await mindeeNetwork.assertPublicHost(url.hostname);
  } catch (error) {
    throw new Error(`Could not download ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function headerValue(raw: unknown): string | undefined {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : undefined;
}

function toBlob(upload: MindeeUpload): Blob {
  return new Blob([new Uint8Array(upload.data)]);
}

async function requestDownload({ url, label, timeoutMs }: { url: URL; label: string; timeoutMs: number }) {
  const dispatcher = await mindeeNetwork.getGuardedDispatcher({ maxResponseBytes: MAX_FILE_BYTES + 1, bodyTimeoutMs: timeoutMs });
  const request = httpClient.sendRequest<Readable>(
    {
      method: HttpMethod.GET,
      url: url.toString(),
      headers: { Accept: '*/*' },
      responseType: 'stream',
      redactBodyInErrors: true,
      followRedirects: false,
      timeout: timeoutMs,
    },
    { dispatcher },
  );
  try {
    return await withDeadline({ promise: request, label, timeoutMs });
  } catch (error) {
    const response: unknown = isRecord(error) || error instanceof Error ? Reflect.get(error, 'response') : undefined;
    if (isRecord(response) && typeof response['status'] === 'number') {
      throw new Error(`Could not download ${label}: the server answered HTTP ${response['status']}.`);
    }
    throw new Error(`Could not download ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function withDeadline<T>({ promise, label, timeoutMs }: { promise: Promise<T>; label: string; timeoutMs: number }): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Downloading ${label} took longer than ${Math.round(timeoutMs / 1000)} seconds.`));
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error: unknown) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function readCapped({ stream, label, timeoutMs }: { stream: Readable; label: string; timeoutMs: number }): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    const timer = setTimeout(() => {
      stream.destroy(new Error(`Downloading ${label} took longer than ${Math.round(timeoutMs / 1000)} seconds.`));
    }, timeoutMs);
    stream.on('data', (chunk: unknown) => {
      const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk));
      total += buffer.length;
      if (total > MAX_FILE_BYTES) {
        stream.destroy(new Error(`${label} is larger than ${MAX_FILE_MB} MB, which Mindee does not accept.`));
        return;
      }
      chunks.push(buffer);
    });
    stream.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    stream.on('end', () => {
      clearTimeout(timer);
      resolve(Buffer.concat(chunks));
    });
  });
}

function checkSize({ data, filename, label }: { data: Buffer; filename: string; label: string }): MindeeUpload {
  if (data.length === 0) {
    throw new Error(`${label} is empty.`);
  }
  if (data.length > MAX_FILE_BYTES) {
    throw new Error(`${label} is larger than ${MAX_FILE_MB} MB, which Mindee does not accept.`);
  }
  return { data, filename };
}

function filenameFromUrl(url: URL): string {
  const last = url.pathname.split('/').filter((segment) => segment.length > 0).pop();
  if (last === undefined) {
    return 'document';
  }
  try {
    return decodeURIComponent(last).slice(0, 200);
  } catch {
    return last.slice(0, 200);
  }
}

const MAX_FILE_MB = 50;
const MAX_FILE_BYTES = MAX_FILE_MB * 1024 * 1024;
const DOWNLOAD_TIMEOUT_MS = 60_000;
const MAX_REDIRECTS = 3;

export const mindeeFiles = { readFileProp, parseHttpsUrl, downloadFile, toBlob, MAX_FILE_MB };

export type MindeeUpload = { data: Buffer; filename: string };
