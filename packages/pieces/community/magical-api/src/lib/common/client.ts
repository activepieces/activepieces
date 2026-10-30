import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export async function magicalApiRequest({
  apiKey,
  path,
  body,
}: {
  apiKey: string;
  path: string;
  body: Record<string, string>;
}): Promise<MagicalApiResponse> {
  try {
    const response = await httpClient.sendRequest<MagicalApiResponseBody>({
      method: HttpMethod.POST,
      url: `${BASE_URL}${path}`,
      headers: {
        'api-key': apiKey.trim(),
        'Content-Type': 'application/json',
      },
      body,
    });
    return { status: response.status, body: response.body ?? {} };
  } catch (error) {
    throw toMagicalApiError(error);
  }
}

export function toMagicalApiError(error: unknown): MagicalApiError {
  if (error instanceof MagicalApiError) {
    return error;
  }
  const { status, responseBody } = extractHttpFailure(error);
  if (status === undefined) {
    const reason = error instanceof Error ? error.message : String(error);
    return new MagicalApiError({
      status: 0,
      message: `MagicalAPI request failed before a response was received: ${reason}`,
      responseBody: undefined,
    });
  }
  return new MagicalApiError({
    status,
    message: describeStatus({ status, vendorMessage: readVendorMessage(responseBody) }),
    responseBody,
  });
}

export class MagicalApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;

  constructor({ status, message, responseBody }: { status: number; message: string; responseBody: unknown }) {
    super(message);
    this.name = 'MagicalApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export const BASE_URL = 'https://gw.magicalapi.com';

function extractHttpFailure(error: unknown): { status: number | undefined; responseBody: unknown } {
  if (typeof error !== 'object' || error === null) {
    return { status: undefined, responseBody: undefined };
  }
  if ('errorMessage' in error && typeof error.errorMessage === 'function') {
    const details: unknown = error.errorMessage();
    const fromDetails = readResponse(details);
    if (fromDetails.status !== undefined) {
      return fromDetails;
    }
  }
  return readResponse(error);
}

function readResponse(value: unknown): { status: number | undefined; responseBody: unknown } {
  if (typeof value !== 'object' || value === null || !('response' in value)) {
    return { status: undefined, responseBody: undefined };
  }
  const response = value.response;
  if (typeof response !== 'object' || response === null) {
    return { status: undefined, responseBody: undefined };
  }
  const status = 'status' in response && typeof response.status === 'number' ? response.status : undefined;
  const responseBody = 'body' in response ? response.body : undefined;
  return { status, responseBody };
}

function readVendorMessage(responseBody: unknown): string | undefined {
  if (typeof responseBody === 'string' && responseBody.length > 0) {
    return responseBody.slice(0, 500);
  }
  if (typeof responseBody === 'object' && responseBody !== null && 'message' in responseBody) {
    const message = responseBody.message;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }
  }
  return undefined;
}

function describeStatus({ status, vendorMessage }: { status: number; vendorMessage: string | undefined }): string {
  const suffix = vendorMessage ? ` MagicalAPI says: "${vendorMessage}"` : '';
  switch (status) {
    case 400:
      return `MagicalAPI rejected the request as invalid (400).${suffix}`;
    case 401:
      return `MagicalAPI rejected the API key (401). Check the key in your connection.${suffix}`;
    case 402:
      return `MagicalAPI account is out of credits or the plan does not include API access (402). Recharge credits or upgrade the plan in the MagicalAPI dashboard.${suffix}`;
    case 403:
      return `MagicalAPI does not allow this service with this API key (403).${suffix}`;
    case 404:
      if (vendorMessage?.toLowerCase().includes('request id')) {
        return `MagicalAPI does not know this Request ID (404). A Request ID only works with the service that created it, and a finished result can be fetched only once.${suffix}`;
      }
      return `MagicalAPI could not find what was requested (404); no credits are charged for a lookup that finds nothing.${suffix}`;
    case 429:
      return `MagicalAPI rate limit reached (429). Wait a moment and try again.${suffix}`;
    default:
      if (status >= 500) {
        return `MagicalAPI had a server error (${status}). Try again later.${suffix}`;
      }
      return `MagicalAPI request failed with status ${status}.${suffix}`;
  }
}

export type MagicalApiResponseBody = {
  data?: Record<string, unknown>;
  usage?: { credits?: number };
};

export type MagicalApiResponse = {
  status: number;
  body: MagicalApiResponseBody;
};
