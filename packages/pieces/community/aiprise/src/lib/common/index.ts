import { httpClient, HttpMethod } from '@activepieces/pieces-common';

const PRODUCTION_BASE_URL = 'https://api.aiprise.com/api/v1';
const SANDBOX_BASE_URL = 'https://api-sandbox.aiprise.com/api/v1';

function getBaseUrl(environment: string): string {
  return environment === 'sandbox' ? SANDBOX_BASE_URL : PRODUCTION_BASE_URL;
}

async function makeRequest<T>({
  auth,
  method,
  path,
  body,
}: {
  auth: AipriseAuthValue;
  method: HttpMethod;
  path: string;
  body?: Record<string, unknown>;
}): Promise<T> {
  const response = await httpClient.sendRequest<T>({
    method,
    url: `${getBaseUrl(auth.environment)}${path}`,
    headers: {
      'X-API-KEY': auth.secret_text,
      'Content-Type': 'application/json',
    },
    body,
  });
  return response.body;
}

export const aiprise = {
  PRODUCTION_BASE_URL,
  SANDBOX_BASE_URL,
  getBaseUrl,
  makeRequest,
};

export type AipriseAuthValue = {
  secret_text: string;
  environment: string;
};
