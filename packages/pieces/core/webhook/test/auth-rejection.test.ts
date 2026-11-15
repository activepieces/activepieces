/// <reference types="vitest/globals" />

import { createHmac } from 'crypto';
import { createMockActionContext, TriggerStrategy } from '@activepieces/pieces-framework';
import { AuthType, catchWebhook } from '../src/lib/triggers/catch-hook';

const rawBody = JSON.stringify({ event: 'push' });
const basic = (password: string) =>
  `Basic ${Buffer.from(`user:${password}`).toString('base64')}`;

const authCases: AuthCase[] = [
  {
    authType: AuthType.BASIC,
    authFields: { username: 'user', password: 'pass' },
    goodHeaders: { authorization: basic('pass') },
    badHeaders: { authorization: basic('wrong') },
  },
  {
    authType: AuthType.HEADER,
    authFields: { headerName: 'x-secret', headerValue: 'good' },
    goodHeaders: { 'x-secret': 'good' },
    badHeaders: { 'x-secret': 'bad' },
  },
  {
    authType: AuthType.HMAC,
    authFields: {
      hmacHeaderName: 'x-signature',
      hmacSecret: 'secret',
      hmacAlgorithm: 'sha256',
      hmacEncoding: 'hex',
      hmacSignaturePrefix: '',
    },
    goodHeaders: {
      'x-signature': createHmac('sha256', 'secret').update(rawBody).digest('hex'),
    },
    badHeaders: { 'x-signature': 'deadbeef' },
  },
];

describe('catchWebhook.run authentication', () => {
  test('passes the request through when no auth is configured', async () => {
    const payload = buildPayload({});
    await expect(
      runCatchWebhook({ authType: AuthType.NONE, authFields: {}, payload })
    ).resolves.toEqual([payload]);
  });

  test.each(authCases)(
    'passes the request through when $authType auth matches',
    async ({ authType, authFields, goodHeaders }) => {
      const payload = buildPayload(goodHeaders);
      await expect(runCatchWebhook({ authType, authFields, payload })).resolves.toEqual([payload]);
    }
  );

  test.each(authCases)(
    'throws instead of dropping the request when $authType auth fails',
    async ({ authType, authFields, badHeaders }) => {
      await expect(
        runCatchWebhook({ authType, authFields, payload: buildPayload(badHeaders) })
      ).rejects.toThrow('Webhook authentication failed');
    }
  );
});

function buildPayload(headers: Record<string, string>) {
  return { body: {}, queryParams: {}, rawBody, headers };
}

function runCatchWebhook({
  authType,
  authFields,
  payload,
}: {
  authType: AuthType;
  authFields: Record<string, string>;
  payload: ReturnType<typeof buildPayload>;
}) {
  if (catchWebhook.type !== TriggerStrategy.WEBHOOK) {
    throw new Error('catchWebhook must be a webhook trigger');
  }
  return catchWebhook.run({
    ...createMockActionContext<typeof catchWebhook.props>({
      propsValue: {
        liveMarkdown: undefined,
        syncMarkdown: undefined,
        testMarkdown: undefined,
        authType,
        authFields,
      },
    }),
    webhookUrl: 'http://localhost:3000/api/v1/webhooks/flow-id',
    payload,
  });
}

type AuthCase = {
  authType: AuthType;
  authFields: Record<string, string>;
  goodHeaders: Record<string, string>;
  badHeaders: Record<string, string>;
};
