import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { respondIoAuth } from './auth';

export type RespondIoApiCallParams = {
  method: HttpMethod;
  url: string;
  body?: unknown;
  auth: PiecePropValueSchema<typeof respondIoAuth>;
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
      token: auth.token,
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
    const err = error as { response?: { status?: number; body?: { message?: string } }; message?: string };
    const status = err.response?.status;
    const message =
      err.response?.body?.message ||
      err.message ||
      'Unknown Respond.io API error';
    throw new Error(
      `Respond.io API Error (${status || 'No Status'}): ${message}`
    );
  }
}
