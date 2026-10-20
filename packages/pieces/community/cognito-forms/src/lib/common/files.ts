import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { FilesService } from '@activepieces/pieces-framework';
import { Readable } from 'node:stream';
import { cognitoRequest, isRecord, toCognitoError, verifiedTls } from './client';
import { readString } from './entries';


export async function fetchCognitoFile({
  apiKey,
  path,
  files,
  fallbackName,
}: {
  apiKey: string;
  path: string;
  files: FilesService;
  fallbackName: string;
}): Promise<CognitoFileOutput> {
  const body = await cognitoRequest<unknown>({ apiKey, method: HttpMethod.GET, path });
  const ref = isRecord(body) ? body : {};
  const fileName = readString(ref['Name']) ?? fallbackName;
  const url = readString(ref['File']) ?? null;
  const content = readString(ref['Content']);
  const data = content ? decodeContent(content) : url ? await downloadUrl(url) : null;
  if (!data) {
    throw new Error('Cognito Forms returned the file details without any content or download link.');
  }
  const file = await files.write({ fileName, data });
  return {
    file,
    file_id: readString(ref['Id']) ?? null,
    file_name: fileName,
    content_type: readString(ref['ContentType']) ?? null,
    size: typeof ref['Size'] === 'number' ? ref['Size'] : data.length,
    url,
  };
}

export function decodeContent(content: string): Buffer {
  const padding = content.endsWith('==') ? 2 : content.endsWith('=') ? 1 : 0;
  const estimated = Math.floor((content.replace(/\s/g, '').length * 3) / 4) - padding;
  if (estimated > MAX_FILE_BYTES) {
    throw tooLarge();
  }
  return Buffer.from(content, 'base64');
}

async function downloadUrl(url: string): Promise<Buffer> {
  let stream: Readable;
  let declared: number;
  try {
    const response = await httpClient.sendRequest<Readable>({
      method: HttpMethod.GET,
      url,
      headers: { Accept: '*/*' },
      responseType: 'stream',
      timeout: DOWNLOAD_TIMEOUT_MS,
    }, { dispatcher: await verifiedTls() });
    stream = response.body;
    const header = response.headers?.['content-length'];
    declared = Number(Array.isArray(header) ? header[0] : header);
  } catch (error) {
    throw toCognitoError(error);
  }
  if (Number.isFinite(declared) && declared > MAX_FILE_BYTES) {
    stream.destroy();
    throw tooLarge();
  }
  return readCapped(stream);
}

function readCapped(stream: Readable): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let total = 0;
    let settled = false;
    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      if (error) {
        stream.destroy();
        reject(error);
      } else {
        resolve(Buffer.concat(chunks, total));
      }
    };
    const timer = setTimeout(() => finish(new Error(`The file download did not finish within ${DOWNLOAD_TIMEOUT_MS / 1000} seconds.`)), DOWNLOAD_TIMEOUT_MS);
    stream.on('data', (chunk: Buffer | string) => {
      const buffer = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      total += buffer.length;
      if (total > MAX_FILE_BYTES) {
        finish(tooLarge());
        return;
      }
      chunks.push(buffer);
    });
    stream.on('end', () => finish());
    stream.on('error', (error: Error) => finish(new Error(`Could not download the file: ${error.message}`)));
  });
}

function tooLarge(): Error {
  return new Error(`The file is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.`);
}

export type CognitoFileOutput = {
  file: string;
  file_id: string | null;
  file_name: string;
  content_type: string | null;
  size: number;
  url: string | null;
};

const DOWNLOAD_TIMEOUT_MS = 120000;
export const MAX_FILE_BYTES = 100 * 1024 * 1024;
