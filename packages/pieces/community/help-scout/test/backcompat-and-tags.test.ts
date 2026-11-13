import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { helpScoutApi } from '../src/lib/common/api';
import { updateCustomerProperties } from '../src/lib/actions/update-customer-properties';
import { updateConversationTags } from '../src/lib/actions/ai/update-conversation-tags';
import { findCustomer } from '../src/lib/actions/find-customer';

const auth = { access_token: 'token' };

function ok(body: unknown = {}) {
  return { status: 200, headers: {}, body };
}
function convo(tags: string[]) {
  return ok({ id: 7, tags: tags.map((tag, i) => ({ id: i, tag })) });
}
function runAction({ action, propsValue }: { action: { run: unknown }; propsValue: Record<string, unknown> }): Promise<unknown> {
  if (typeof action.run !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(action.run, action, [{ auth, propsValue }]));
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('backward-compatible outputs of pre-0.3.0 actions', () => {
  it('update_customer_properties still returns success', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue({ status: 204, headers: {}, body: undefined });
    const result = await runAction({ action: updateCustomerProperties, propsValue: { customerId: 5, fields: { plan: 'pro' } } });
    expect(result).toEqual({ success: true, customerId: '5', updated: ['plan'] });
  });
  it('update_customer_properties skips the request when every property is empty', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest');
    const result = await runAction({ action: updateCustomerProperties, propsValue: { customerId: 5, fields: { plan: '', seats: null } } });
    expect(result).toEqual({ success: true, customerId: '5', updated: [] });
    expect(spy).not.toHaveBeenCalled();
  });
  it('findFirst keeps _links on the returned record', () => {
    const body = { _embedded: { customers: [{ id: 1, _links: { self: { href: 'x' } } }] } };
    expect(helpScoutApi.findFirst({ body, key: 'customers' })).toEqual({ found: true, data: { id: 1, _links: { self: { href: 'x' } } } });
  });
  it('find_customer returns found + data with _links', async () => {
    vi.spyOn(httpClient, 'sendRequest').mockResolvedValue(ok({ _embedded: { customers: [{ id: 3, _links: { self: { href: 'y' } } }] } }));
    const result = await runAction({ action: findCustomer, propsValue: { email: 'a@b.co' } });
    expect(result).toEqual({ found: true, data: { id: 3, _links: { self: { href: 'y' } } } });
  });
});

describe('update_conversation_tags read-merge-write', () => {
  it('adds a tag, verifies, and does not rewrite when nothing changed', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(convo(['vip']))
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(convo(['vip', 'urgent']));
    const result = await runAction({ action: updateConversationTags, propsValue: { conversationId: 7, tags: ['urgent'], mode: 'add' } });
    expect(result).toEqual({ conversationId: '7', tags: ['vip', 'urgent'] });
    expect(spy).toHaveBeenCalledTimes(3);
    const put = spy.mock.calls[1][0];
    expect(put.method).toBe(HttpMethod.PUT);
    expect(put.body).toEqual({ tags: ['vip', 'urgent'] });
  });
  it('re-applies once when a concurrent change shows up after the write', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(convo(['vip']))
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(convo(['vip', 'billing']))
      .mockResolvedValueOnce(ok());
    const result = await runAction({ action: updateConversationTags, propsValue: { conversationId: 7, tags: ['urgent'], mode: 'add' } });
    expect(result).toMatchObject({ tags: ['vip', 'billing', 'urgent'] });
    expect(spy).toHaveBeenCalledTimes(4);
    expect(spy.mock.calls[3][0].body).toEqual({ tags: ['vip', 'billing', 'urgent'] });
  });
  it('remove keeps other tags and re-removes if a concurrent write restored it', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest')
      .mockResolvedValueOnce(convo(['vip', 'spam']))
      .mockResolvedValueOnce(ok())
      .mockResolvedValueOnce(convo(['vip', 'spam', 'billing']))
      .mockResolvedValueOnce(ok());
    const result = await runAction({ action: updateConversationTags, propsValue: { conversationId: 7, tags: ['spam'], mode: 'remove' } });
    expect(result).toMatchObject({ tags: ['vip', 'billing'] });
    expect(spy).toHaveBeenCalledTimes(4);
  });
  it('replace writes once without reading', async () => {
    const spy = vi.spyOn(httpClient, 'sendRequest').mockResolvedValueOnce(ok());
    const result = await runAction({ action: updateConversationTags, propsValue: { conversationId: 7, tags: ['a', 'A'], mode: 'replace' } });
    expect(result).toMatchObject({ tags: ['a'] });
    expect(spy).toHaveBeenCalledTimes(1);
  });
});
