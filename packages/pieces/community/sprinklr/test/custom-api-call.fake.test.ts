import { HttpMethod } from '@activepieces/pieces-common';
import { createMockActionContext } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it } from 'vitest';
import { sprinklr } from '../src/index';
import { FAKE_SPRINKLR_CLIENT, FakeSprinklr, startFakeSprinklr } from './support/fake-sprinklr';

let fake: FakeSprinklr | undefined;

afterEach(async () => {
  await fake?.close();
  fake = undefined;
});

async function runCustomApiCall({ f, url }: { f: FakeSprinklr; url: string }) {
  const action = sprinklr.actions()['custom_api_call'];
  const token = f.state.tokens[FAKE_SPRINKLR_CLIENT.apiKey] ?? f.control.issueToken();
  const propsValue = { url: { url }, method: HttpMethod.GET, headers: {}, queryParams: {}, body_type: 'none', body: {}, failsafe: false };
  const context = {
    ...createMockActionContext({ propsValue }),
    auth: { access_token: token.accessToken, client_id: FAKE_SPRINKLR_CLIENT.apiKey, props: { base: f.baseUrl, callback: FAKE_SPRINKLR_CLIENT.redirectUris[0] } },
  } as unknown as Parameters<typeof action.run>[0];
  return { token, result: (await action.run(context)) as { status: number; body: unknown } };
}

describe.each([
  ['production', undefined],
  ['prod2', 'prod2'],
])('Custom API Call against the fake Sprinklr (%s)', (_name, segment) => {
  it('sends both the bearer token and the Key header to a path under {base}/api', async () => {
    fake = await startFakeSprinklr({ segment });

    const { token, result } = await runCustomApiCall({ f: fake, url: '/v3/me' });

    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ data: [{ email: 'service.user@example.com' }] });
    const request = fake.state.requests.find((r) => r.path.endsWith('/api/v3/me'));
    expect(request?.path).toBe(segment ? `/${segment}/api/v3/me` : '/api/v3/me');
    expect(request?.status).toBe(200);
    expect(request?.headers['authorization']).toBe(`Bearer ${token.accessToken}`);
    expect(request?.headers['key']).toBe(FAKE_SPRINKLR_CLIENT.apiKey);
  });

  it('accepts a full URL too', async () => {
    fake = await startFakeSprinklr({ segment });

    const { result } = await runCustomApiCall({ f: fake, url: `${fake.baseUrl}/api/v3/me` });

    expect(result.status).toBe(200);
    expect(fake.state.requests.at(-1)?.headers['key']).toBe(FAKE_SPRINKLR_CLIENT.apiKey);
  });
});
