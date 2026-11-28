import { httpClient, HttpRequest } from '@activepieces/pieces-common';
import { describe, MockInstance, vi } from 'vitest';
import { SprinklrAuthValue } from '../../src/lib/common/client';
import { sprinklrEnvironments } from '../../src/lib/common/environments';

export const SPRINKLR_MOCK_BASE_URL = 'https://developer.sprinklr.com/_mock/apis/sprinklr-v3';

export const SPRINKLR_MOCK_ENABLED = process.env['SPRINKLR_MOCK'] === '1';

export const describeMock = SPRINKLR_MOCK_ENABLED ? describe : describe.skip;

export const MOCK_AUTH: SprinklrAuthValue = {
  access_token: 'mock-token',
  client_id: 'mock-key',
  props: { base: sprinklrEnvironments.API_HOST, callback: sprinklrEnvironments.DEFAULT_CALLBACK_URL },
};

export function toMockUrl(url: string): string {
  const apiBase = sprinklrEnvironments.apiBaseUrl(sprinklrEnvironments.API_HOST);
  if (url !== apiBase && !url.startsWith(`${apiBase}/`) && !url.startsWith(`${apiBase}?`)) {
    throw new Error(`The Sprinklr mock helper only rewrites ${apiBase} URLs, got ${url}`);
  }
  return `${SPRINKLR_MOCK_BASE_URL}${url.slice(apiBase.length)}`;
}

export function routeToSprinklrMock({ stripHeaders = false }: { stripHeaders?: boolean } = {}): SprinklrMockRoute {
  const original = httpClient.sendRequest.bind(httpClient);
  const requests: HttpRequest[] = [];
  const spy = vi.spyOn(httpClient, 'sendRequest').mockImplementation((request) => {
    const rewritten: HttpRequest = {
      ...request,
      url: toMockUrl(request.url),
      headers: stripHeaders ? { Accept: 'application/json' } : request.headers,
    };
    requests.push(rewritten);
    return original(rewritten);
  });
  return { spy, requests };
}

export type SprinklrMockRoute = {
  spy: MockInstance<typeof httpClient.sendRequest>;
  requests: HttpRequest[];
};
