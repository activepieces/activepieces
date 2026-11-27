import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  AppConnectionType,
  AppConnectionValueForAuthProperty,
  createMockActionContext,
  InputPropertyMap,
  StaticPropsValue,
} from '@activepieces/pieces-framework';
import { afterEach, beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { sendr } from '../src';
import { getUserInfo } from '../src/lib/actions/get-user-info';
import { sendrAuth } from '../src/lib/auth';
import { sendrApiCall } from '../src/lib/common';

const API_KEY = 'sendr_test_key';
const AUTH: AppConnectionValueForAuthProperty<typeof sendrAuth> = { type: AppConnectionType.SECRET_TEXT, secret_text: API_KEY };
const SERVER = { apiUrl: 'http://localhost:3000', publicUrl: 'http://localhost:4200', mintOidcToken: async () => 'test-oidc-token' };
const SEAT = { email: 'seat@acme.test', workspaceName: 'Acme' };

let sendRequest: MockInstance<typeof httpClient.sendRequest>;

function sentRequest() {
  return sendRequest.mock.calls[0][0];
}

function actionContext(propsValue: StaticPropsValue<InputPropertyMap>) {
  return { ...createMockActionContext<InputPropertyMap>({ propsValue }), auth: AUTH };
}

beforeEach(() => {
  sendRequest = vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 200, headers: {}, body: SEAT });
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Sendr API key header', () => {
  it('sends the key as X-API-Key when saving the connection', async () => {
    const result = await sendrAuth.validate?.({ auth: API_KEY, server: SERVER });
    expect(result).toEqual({ valid: true });
    expect(sentRequest().url).toBe('https://api.sendr.io/seat/me');
    expect(sentRequest().headers).toEqual({ 'X-API-Key': API_KEY });
  });

  it('still rejects a key Sendr does not accept', async () => {
    sendRequest.mockRejectedValueOnce(new Error('401 Seat API Authorization failed'));
    const result = await sendrAuth.validate?.({ auth: 'wrong_key', server: SERVER });
    expect(result).toEqual({ valid: false, error: 'Invalid API Key. Please verify your key and try again.' });
  });

  it('sends the key as X-API-Key on every action call', async () => {
    await sendrApiCall({ token: API_KEY, method: HttpMethod.GET, path: '/sheet' });
    expect(sentRequest().authentication).toBeUndefined();
    expect(sentRequest().headers).toEqual({ 'X-API-Key': API_KEY });
  });

  it('sends the key as X-API-Key from Get Account Info', async () => {
    const result = await getUserInfo.run(actionContext({}));
    expect(result).toEqual(SEAT);
    expect(sentRequest().headers).toEqual({ 'X-API-Key': API_KEY });
  });

  it('sends the key as X-API-Key from Custom API Call', async () => {
    await sendr.getAction('custom_api_call')?.run(actionContext({ method: HttpMethod.GET, url: { url: '/sheet' }, headers: {}, queryParams: {} }));
    expect(sentRequest().url).toBe('https://api.sendr.io/api/v1/sheet');
    expect(sentRequest().headers).toEqual({ 'X-API-Key': API_KEY });
  });
});
