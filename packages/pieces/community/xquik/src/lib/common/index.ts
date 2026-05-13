import { HttpMethod, httpClient } from '@activepieces/pieces-common';

function cleanQueryParams(
  params: Record<string, boolean | number | string | undefined>
): Record<string, string> {
  const queryParams: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === '') {
      continue;
    }

    queryParams[key] = String(value);
  }

  return queryParams;
}

function encodePathPart(value: string): string {
  return encodeURIComponent(requireText({ name: 'path value', value }));
}

function requireText({ name, value }: { name: string; value: string }): string {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    throw new Error(`${name} is required`);
  }

  return trimmed;
}

function stripAtPrefix(value: string): string {
  const trimmed = requireText({ name: 'user', value });

  return trimmed.startsWith('@') ? trimmed.slice(1) : trimmed;
}

async function get({
  apiKey,
  path,
  queryParams,
}: XquikGetParams): Promise<unknown> {
  const response = await httpClient.sendRequest({
    method: HttpMethod.GET,
    url: `${xquikCommon.config.baseUrl}${path}`,
    headers: {
      Accept: 'application/json',
      'User-Agent': xquikCommon.config.userAgent,
      'x-api-key': apiKey,
      'xquik-api-contract': xquikCommon.config.apiContract,
    },
    queryParams,
  });

  return response.body;
}

export const xquikCommon = {
  api: {
    get,
  },
  config: {
    apiContract: '2026-04-29',
    baseUrl: 'https://xquik.com/api/v1',
    userAgent: 'activepieces-xquik/0.0.1',
  },
  utils: {
    cleanQueryParams,
    encodePathPart,
    requireText,
    stripAtPrefix,
  },
};

type XquikGetParams = {
  apiKey: string;
  path: string;
  queryParams?: Record<string, string>;
};
