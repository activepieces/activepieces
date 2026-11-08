import crypto from 'crypto';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { httpClient } from '@activepieces/pieces-common';
import { conversationCreated } from '../src/lib/triggers/conversation-created';
import { conversationAssigned } from '../src/lib/triggers/conversation-assigned';
import { tagsUpdated } from '../src/lib/triggers/tags-updated';
import { newCustomer } from '../src/lib/triggers/new-customer';

const auth = { access_token: 'token' };
const secret = 'test-secret';
const links = { web: { href: 'https://secure.helpscout.net/conversation/1/2/' } };

function storeWith(value: unknown) {
  return { get: async () => value, put: async () => undefined, delete: async () => undefined };
}

function callTrigger({ trigger, fn, context }: { trigger: object; fn: unknown; context: unknown }): Promise<unknown> {
  if (typeof fn !== 'function') {
    throw new Error('trigger has no such method');
  }
  return Promise.resolve(Reflect.apply(fn, trigger, [context]));
}

function signedContext(body: Record<string, unknown>) {
  const rawBody = JSON.stringify(body);
  const signature = crypto.createHmac('sha1', secret).update(rawBody).digest('base64');
  return {
    auth,
    propsValue: {},
    store: storeWith({ webhookId: '1', WebhookSecret: secret }),
    payload: { headers: { 'x-helpscout-signature': signature }, rawBody, body },
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('triggers keep _links so saved flows can map the web link', () => {
  const conversationTriggers = [conversationCreated, conversationAssigned, tagsUpdated];

  it.each(conversationTriggers.map((trigger) => [trigger.name, trigger]))('%s run returns _links.web.href', async (_name, trigger) => {
    const body = { id: 1, number: 2, assignee: { id: 9 }, _links: links };
    const out = await callTrigger({ trigger, fn: trigger.run, context: signedContext(body) });
    expect(out).toEqual([body]);
  });

  it.each(conversationTriggers.map((trigger) => [trigger.name, trigger]))('%s test returns _links.web.href', async (_name, trigger) => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({
      status: 200,
      headers: {},
      body: { _embedded: { conversations: [{ id: 1, _links: links }] } },
    });
    const out = await callTrigger({ trigger, fn: trigger.test, context: { auth, propsValue: {}, store: storeWith(null) } });
    expect(out).toEqual([{ id: 1, _links: links }]);
  });

  it('new customer run keeps _links', async () => {
    const body = { id: 5, firstName: 'Jane', _links: { self: { href: 'x' } } };
    const out = await callTrigger({ trigger: newCustomer, fn: newCustomer.run, context: signedContext(body) });
    expect(out).toEqual([body]);
  });

  it('conversation webhook output schema exposes the web link', () => {
    const linksField = conversationCreated.outputSchema?.fields.find((field) => field.key === '_links');
    expect(linksField?.children?.[0]).toMatchObject({ key: 'web', children: [{ key: 'href' }] });
  });
});
