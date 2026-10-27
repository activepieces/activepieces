import { httpClient, HttpError, HttpMethod, QueryParams } from '@activepieces/pieces-common';

export const COGNITO_API_BASE = 'https://www.cognitoforms.com/api';


export class CognitoFormsApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly errorType: string | undefined,
    readonly responseBody: unknown,
  ) {
    super(message);
    this.name = 'CognitoFormsApiError';
  }
}

let verifiedTlsAgent: Promise<unknown> | undefined;

export function verifiedTls(): Promise<unknown> {
  verifiedTlsAgent ??= import('undici').then(({ Agent }) => new Agent({ connect: { rejectUnauthorized: true } }));
  return verifiedTlsAgent;
}

export async function cognitoRequest<T>({
  apiKey,
  method,
  path,
  body,
  query,
}: {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  query?: QueryParams;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${COGNITO_API_BASE}${path}`,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
      body,
      queryParams: query,
      timeout: REQUEST_TIMEOUT_MS,
      redactBodyInErrors: true,
    }, { dispatcher: await verifiedTls() });
    return response.body;
  } catch (error) {
    throw toCognitoError(error);
  }
}

export function toCognitoError(error: unknown): Error {
  if (error instanceof CognitoFormsApiError) {
    return error;
  }
  if (error instanceof HttpError) {
    const status = error.response.status;
    const responseBody = error.response.body;
    const vendor = readVendorError(responseBody);
    return new CognitoFormsApiError(describeStatus({ status, vendor }), status, vendor.type, responseBody);
  }
  if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) {
    return new Error(`Cognito Forms did not respond within ${REQUEST_TIMEOUT_MS / 1000} seconds. Please try again.`);
  }
  const reason = error instanceof Error ? error.message : String(error);
  return new Error(`Could not reach Cognito Forms: ${reason}`);
}

export function encodeSegment(value: string | number): string {
  return encodeURIComponent(String(value).trim());
}

function describeStatus({ status, vendor }: { status: number; vendor: VendorError }): string {
  const detail = vendor.message ? ` Cognito Forms said: "${vendor.message}"` : '';
  const data = vendor.data ? ` Details: ${vendor.data}` : '';
  switch (status) {
    case 400:
    case 422:
      return `Cognito Forms rejected the request (${status}).${detail}${data} Check that the field names and values match the form (use "Get Form Schema").`;
    case 401:
      return `Cognito Forms rejected the API key (401). Check the key in your connection, or create a new one under Organization Settings > Integrations.${detail}`;
    case 402:
      return `This feature needs a paid Cognito Forms plan (402).${detail}`;
    case 403:
      return `The API key is not allowed to do this (403). In Cognito Forms, open Organization Settings > Integrations and give the key the needed scope (Read, Write or Delete) and access to this form.${detail}`;
    case 404:
      return `Not found (404).${detail} Check the IDs you passed.`;
    case 429:
      return `Cognito Forms rate limit reached (429). Wait a minute and try again.${detail}`;
    default:
      return `Cognito Forms request failed (${status}).${detail}${data}`;
  }
}

type VendorError = { message?: string; type?: string; data?: string };

function readVendorError(body: unknown): VendorError {
  if (typeof body === 'string') {
    return { message: body.slice(0, 500) || undefined };
  }
  if (!isRecord(body)) {
    return {};
  }
  const message = typeof body['Message'] === 'string' ? body['Message'] : undefined;
  const type = typeof body['Type'] === 'string' ? body['Type'] : undefined;
  const rawData = body['Data'];
  const data = hasContent(rawData) ? JSON.stringify(rawData).slice(0, 1000) : undefined;
  return { message, type, data };
}

function hasContent(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  if (isRecord(value)) {
    return Object.keys(value).length > 0;
  }
  return true;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const REQUEST_TIMEOUT_MS = 60000;
