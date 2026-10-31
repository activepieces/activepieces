import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMethod,
} from '@activepieces/pieces-common';

async function request<T>({
  apiKey,
  method,
  path,
  body,
}: ProoftellRequest): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${PROOFTELL_API_URL}${path}`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: apiKey,
      },
      headers: {
        'User-Agent': PROOFTELL_USER_AGENT,
      },
      body: body === undefined ? undefined : withoutEmptyFields(body),
      redactBodyInErrors: true,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      throw new Error(messageOf(error));
    }
    throw error;
  }
}

function withoutEmptyFields(body: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(body).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

function messageOf(error: HttpError): string {
  const { status, body } = error.response;
  if (isRecord(body) && isRecord(body['error']) && typeof body['error']['message'] === 'string') {
    return body['error']['message'];
  }
  return `ProofTell answered ${status} without a message.`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export const prooftellApi = {
  request,
};

export const PROOFTELL_API_URL = 'https://api.prooftell.com';

const PROOFTELL_USER_AGENT = 'prooftell-activepieces/0.0.1';

type ProoftellRequest = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
};
