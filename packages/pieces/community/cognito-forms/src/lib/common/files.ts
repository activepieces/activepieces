import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { FilesService } from '@activepieces/pieces-framework';
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
  const data = content ? Buffer.from(content, 'base64') : url ? await downloadUrl(url) : null;
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

async function downloadUrl(url: string): Promise<Buffer> {
  try {
    const response = await httpClient.sendRequest<ArrayBuffer>({
      method: HttpMethod.GET,
      url,
      headers: { Accept: '*/*' },
      responseType: 'arraybuffer',
      timeout: DOWNLOAD_TIMEOUT_MS,
    }, { dispatcher: await verifiedTls() });
    const data = Buffer.from(response.body);
    if (data.length > MAX_FILE_BYTES) {
      throw new Error(`The file is larger than ${MAX_FILE_BYTES / 1024 / 1024} MB.`);
    }
    return data;
  } catch (error) {
    throw toCognitoError(error);
  }
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
const MAX_FILE_BYTES = 100 * 1024 * 1024;
