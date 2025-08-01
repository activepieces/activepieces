import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { RespondIoAuth } from './auth';

export type RespondIoApiCallParams = {
  method: HttpMethod;
  url: string;
  body?: unknown;
  auth: PiecePropValueSchema<typeof RespondIoAuth>;
};

export async function respondIoApiCall<T extends HttpMessageBody>({
  method,
  url,
  body,
  auth,
}: RespondIoApiCallParams): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `https://api.respond.io/v2${url}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth,
    },
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json',
    },
    body,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: unknown) {
    const err = error as { response?: { status?: number, body?: { message?: string } }, message?: string };
    const status = err.response?.status;
    const message = err.response?.body?.message || err.message || 'Unknown API error.';

    switch (status) {
      case 400:
        throw new Error(`Respond.io API Error: Bad Request. The server could not understand the request due to invalid syntax. Details: ${message}`);
      case 401:
      case 403:
        throw new Error(`Respond.io API Error: Authentication failed. Please check your API Token. Details: ${message}`);
      case 409:
        throw new Error(`Respond.io API Error: Conflict. The request could not be completed due to a conflict with the current state of the target resource. Details: ${message}`);
      case 429:
        throw new Error(`Respond.io API Error: Rate limit exceeded. Please wait before making new requests. Details: ${message}`);
      default:
        throw new Error(`Respond.io API Error (Status ${status || 'N/A'}): ${message}`);
    }
  }
}
