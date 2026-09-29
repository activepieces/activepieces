import { Readable } from 'stream';
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
      'Downloads a private file uploaded to Linear, such as an image or log embedded in an issue description or comment, from its https://uploads.linear.app/... link and returns it as a flow file. Only uploads.linear.app links are accepted, because the API key is sent with the request. Read-only and idempotent: the same link returns the same file.',
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
    const response = await downloadWithManualRedirects({ url, apiKey: auth.secret_text });
    const fileName = (propsValue.file_name?.trim() || defaultFileName({ url, mimeType: response.mimeType })).slice(0, 200);
    const file = await files.write({ fileName, data: response.data });
    return {
      file,
      file_name: fileName,
      mime_type: response.mimeType,
      size_bytes: response.data.length,
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
  if (parsed.protocol !== 'https:' || parsed.hostname !== LINEAR_UPLOAD_HOST || parsed.username || parsed.password || parsed.port) {
    throw new Error('Only https://uploads.linear.app/... links can be downloaded, because the Linear API key is sent with the request.');
  }
  return parsed;
}

async function downloadWithManualRedirects({ url, apiKey }: { url: URL; apiKey: string }): Promise<DownloadResult> {
  let current = url;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const sendKey = current.hostname === LINEAR_UPLOAD_HOST && current.protocol === 'https:';
    const response = await httpClient.sendRequest<Readable>({
      method: HttpMethod.GET,
      url: current.toString(),
      headers: sendKey ? { Authorization: apiKey } : {},
      responseType: 'stream',
      followRedirects: false,
      timeout: DOWNLOAD_TIMEOUT_MS,
    });
    const location = response.headers?.['location'];
    if (response.status >= 300 && response.status < 400) {
      if (typeof location !== 'string' || location.length === 0) {
        throw new Error(`Linear answered with a redirect (${response.status}) but no location.`);
      }
      response.body?.destroy?.();
      const next = new URL(location, current);
      if (next.protocol !== 'https:') {
        throw new Error('Linear redirected the download to a non-https address, so it was stopped.');
      }
      current = next;
      continue;
    }
    const declared = Number(response.headers?.['content-length']);
    if (Number.isFinite(declared) && declared > MAX_DOWNLOAD_BYTES) {
      response.body?.destroy?.();
      throw new Error(TOO_LARGE_MESSAGE);
    }
    const data = await readCapped({ body: response.body, limit: MAX_DOWNLOAD_BYTES });
    const contentType = response.headers?.['content-type'];
    return { data, mimeType: typeof contentType === 'string' ? contentType : null };
  }
  throw new Error('Too many redirects while downloading the Linear upload.');
}

async function readCapped({ body, limit }: { body: Readable | Buffer | undefined; limit: number }): Promise<Buffer> {
  if (body === undefined) {
    return Buffer.alloc(0);
  }
  if (Buffer.isBuffer(body)) {
    if (body.length > limit) {
      throw new Error(TOO_LARGE_MESSAGE);
    }
    return body;
  }
  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of body) {
    const piece = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    total += piece.length;
    if (total > limit) {
      body.destroy();
      throw new Error(TOO_LARGE_MESSAGE);
    }
    chunks.push(piece);
  }
  return Buffer.concat(chunks);
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
const MAX_REDIRECTS = 3;
const DOWNLOAD_TIMEOUT_MS = 60_000;
const MAX_DOWNLOAD_BYTES = 100 * 1024 * 1024;
const TOO_LARGE_MESSAGE = `The file is larger than ${MAX_DOWNLOAD_BYTES / (1024 * 1024)} MB.`;

type DownloadResult = {
  data: Buffer;
  mimeType: string | null;
};
