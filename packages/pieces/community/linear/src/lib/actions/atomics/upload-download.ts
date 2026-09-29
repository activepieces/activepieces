import { pipeline, Readable, Transform } from 'stream';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { linearAuth } from '../../..';
import { atomicUploadDownloadOutputSchema } from './output-schemas';

export const linearUploadDownloadAtomic = createAction({
  auth: linearAuth,
  name: 'linear_upload_download',
  classification: 'READ',
  displayName: 'Download Linear Upload (AI)',
  description: 'Download a file uploaded to Linear (an uploads.linear.app link from an issue or comment).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Downloads a private file uploaded to Linear, such as an image or log embedded in an issue description or comment, from its https://uploads.linear.app/... link and returns it as a flow file. Only uploads.linear.app links are accepted, because the API key is sent with the request, and redirects are followed only to Linear file hosts. The file size limit of this Activepieces deployment applies. Read-only and idempotent: the same link returns the same file.',
    idempotent: true,
  },
  props: {
    url: Property.ShortText({
      displayName: 'Upload URL',
      description: 'The https://uploads.linear.app/... link, copied from the markdown of an issue or comment.',
      required: true,
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: 'Name for the saved file. Leave empty to use the last part of the link.',
      required: false,
    }),
  },
  outputSchema: atomicUploadDownloadOutputSchema,
  async run({ auth, propsValue, files }) {
    const url = assertLinearUploadUrl(propsValue.url);
    const response = await openDownload({ url, apiKey: auth.secret_text });
    const fileName = (propsValue.file_name?.trim() || defaultFileName({ url, mimeType: response.mimeType })).slice(0, 200);
    const counted = countBytes(response.body);
    const file = await files.write({ fileName, data: counted.stream }).catch((error: unknown) => {
      counted.stream.destroy();
      throw error;
    });
    return {
      file,
      file_name: fileName,
      mime_type: response.mimeType,
      size_bytes: counted.total(),
    };
  },
});

export function assertLinearUploadUrl(raw: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(raw.trim());
  } catch {
    throw new Error('Upload URL must be a full https://uploads.linear.app/... link.');
  }
  if (!isSafeHttpsUrl({ url: parsed }) || parsed.hostname !== LINEAR_UPLOAD_HOST) {
    throw new Error('Only https://uploads.linear.app/... links can be downloaded, because the Linear API key is sent with the request.');
  }
  return parsed;
}

function isSafeHttpsUrl({ url }: { url: URL }): boolean {
  return url.protocol === 'https:' && !url.username && !url.password && !url.port;
}

function assertAllowedDownloadUrl({ url }: { url: URL }): void {
  if (!isSafeHttpsUrl({ url }) || !ALLOWED_DOWNLOAD_HOSTS.includes(url.hostname)) {
    throw new Error(`Linear redirected the download to ${url.host || 'an unexpected address'}, which is not a Linear file host, so it was stopped.`);
  }
}

async function openDownload({ url, apiKey }: { url: URL; apiKey: string }): Promise<OpenedDownload> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    assertAllowedDownloadUrl({ url: current });
    const sendKey = current.hostname === LINEAR_UPLOAD_HOST;
    const response = await httpClient.sendRequest<Readable | Buffer | undefined>({
      method: HttpMethod.GET,
      url: current.toString(),
      headers: sendKey ? { Authorization: apiKey } : {},
      responseType: 'stream',
      followRedirects: false,
      timeout: DOWNLOAD_TIMEOUT_MS,
    });
    const body = toReadable(response.body);
    if (response.status >= 300 && response.status < 400) {
      body.destroy();
      const location = response.headers?.['location'];
      if (typeof location !== 'string' || location.length === 0) {
        throw new Error(`Linear answered with a redirect (${response.status}) but no location.`);
      }
      current = parseRedirect({ location, base: current });
      continue;
    }
    const contentType = response.headers?.['content-type'];
    return { body, mimeType: typeof contentType === 'string' ? contentType : null };
  }
  throw new Error('Too many redirects while downloading the Linear upload.');
}

function parseRedirect({ location, base }: { location: string; base: URL }): URL {
  try {
    return new URL(location, base);
  } catch {
    throw new Error('Linear answered with a redirect to an address that is not a valid link.');
  }
}

function toReadable(body: Readable | Buffer | undefined): Readable {
  if (body === undefined) return Readable.from([]);
  if (Buffer.isBuffer(body)) return Readable.from([body]);
  return body;
}

function countBytes(body: Readable): { stream: Readable; total: () => number } {
  let total = 0;
  const counter = new Transform({
    transform(chunk: unknown, _encoding, callback) {
      const bytes = toBuffer(chunk);
      total += bytes.length;
      callback(null, bytes);
    },
  });
  const stream = pipeline(body, counter, () => undefined);
  return { stream, total: () => total };
}

function toBuffer(chunk: unknown): Buffer {
  if (Buffer.isBuffer(chunk)) return chunk;
  if (chunk instanceof Uint8Array) return Buffer.from(chunk);
  return Buffer.from(String(chunk));
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function defaultFileName({ url, mimeType }: { url: URL; mimeType: string | null }): string {
  const last = url.pathname.split('/').filter((part) => part.length > 0).pop();
  const name = safeDecode(last ?? 'linear-upload');
  if (name.includes('.')) return name;
  const extension = mimeType ? EXTENSION_BY_MIME[mimeType.split(';')[0].trim().toLowerCase()] : undefined;
  return extension ? `${name}.${extension}` : name;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'application/zip': 'zip',
  'application/json': 'json',
  'text/plain': 'txt',
  'text/csv': 'csv',
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
};

const LINEAR_UPLOAD_HOST = 'uploads.linear.app';
const ALLOWED_DOWNLOAD_HOSTS = [LINEAR_UPLOAD_HOST, 'storage.googleapis.com'];
const MAX_REDIRECTS = 3;
const DOWNLOAD_TIMEOUT_MS = 60_000;

type OpenedDownload = {
  body: Readable;
  mimeType: string | null;
};
