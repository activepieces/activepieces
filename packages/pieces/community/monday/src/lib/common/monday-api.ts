import { httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { isNil } from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { MONDAY_AI_API_VERSION } from './client';

async function uploadFile<T>({
  apiKey,
  query,
  variables,
  file,
  fileName,
}: {
  apiKey: string;
  query: string;
  variables: Record<string, unknown>;
  file: Buffer;
  fileName: string;
}): Promise<T> {
  const formData = new FormData();
  formData.append('query', query);
  formData.append('variables', JSON.stringify(variables));
  formData.append('map', JSON.stringify({ file: 'variables.file' }));
  formData.append('file', file, fileName);

  const response = await sendOrThrow<T>(() =>
    httpClient.sendRequest<MondayGraphQLResponse<T>>({
      method: HttpMethod.POST,
      url: MONDAY_FILE_API_URL,
      headers: {
        Authorization: apiKey,
        'API-Version': MONDAY_AI_API_VERSION,
        ...formData.getHeaders(),
      },
      body: formData,
    })
  );
  return unwrap(response);
}

function toJsonString(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value ?? {});
}

function joinValues(values: unknown): string | null {
  if (!Array.isArray(values) || values.length === 0) {
    return null;
  }
  return values
    .map((v) => (typeof v === 'object' && v !== null ? JSON.stringify(v) : String(v)))
    .join(', ');
}

function toStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }
  return values
    .filter((v) => !isNil(v) && String(v).trim() !== '')
    .map((v) => String(v).trim());
}

export const mondayApi = {
  uploadFile,
  toJsonString,
  joinValues,
  toStringArray,
};

async function sendOrThrow<T>(
  send: () => Promise<{ body: MondayGraphQLResponse<T> }>
): Promise<MondayGraphQLResponse<T>> {
  try {
    const response = await send();
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw new Error(describeHttpError({ status: error.response.status, body: error.response.body }));
    }
    throw error;
  }
}

function unwrap<T>(body: MondayGraphQLResponse<T>): T {
  if (!isNil(body.errors) && body.errors.length > 0) {
    throw new Error(`monday.com API error: ${body.errors.map((e) => e.message).join('; ')}`);
  }
  if (!isNil(body.error_message)) {
    throw new Error(`monday.com API error: ${body.error_message}`);
  }
  if (isNil(body.data)) {
    throw new Error('monday.com API returned no data.');
  }
  return body.data;
}

function describeHttpError({ status, body }: { status: number; body: unknown }): string {
  const detail = typeof body === 'string' ? body : JSON.stringify(body);
  switch (status) {
    case 401:
      return `monday.com rejected the API token (401). Reconnect the monday.com connection. ${detail}`;
    case 403:
      return `The connected monday.com user lacks permission for this operation (403). ${detail}`;
    case 404:
      return `monday.com resource not found (404). ${detail}`;
    case 429:
      return `monday.com rate or complexity limit reached (429). Retry after a short wait. ${detail}`;
    default:
      return `monday.com request failed with status ${status}. ${detail}`;
  }
}

const MONDAY_FILE_API_URL = 'https://api.monday.com/v2/file';

type MondayGraphQLResponse<T> = {
  data?: T;
  errors?: { message: string }[];
  error_message?: string;
};
