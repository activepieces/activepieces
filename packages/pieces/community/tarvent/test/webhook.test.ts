import { beforeEach, describe, expect, it, vi } from 'vitest';
import { memoryStore, ok, TEST_AUTH } from './helpers';

const sendRequest = vi.fn();

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
  return { ...actual, httpClient: { sendRequest: (...args: unknown[]) => sendRequest(...args) } };
});

import { tarventWebhook } from '../src/lib/common/webhook';
import { tarventCommon } from '../src/lib/common';

beforeEach(() => {
  sendRequest.mockReset();
});

const handlers = tarventWebhook.handlers({ type: 'contactAdded', storeKey: 'tarvent_contact_added' });

describe('webhook lifecycle', () => {
  it('stores the created webhook id', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createWebhook: { id: 'w1' } } }));
    const store = memoryStore();
    await handlers.onEnable({ auth: TEST_AUTH, propsValue: { include: 'BASIC' }, webhookUrl: 'https://hook', store });
    expect(store.data.get('tarvent_contact_added')).toEqual({ id: 'w1' });
    expect(sendRequest.mock.calls[0][0].body.variables).toMatchObject({ callBackUrl: 'https://hook', events: [{ entityType: null, eventType: 'CONTACT_ADDED' }], filter: null, dataSettings: 'BASIC' });
  });

  it('fails onEnable when Tarvent returns an error, storing nothing', async () => {
    sendRequest.mockResolvedValueOnce(ok({ errors: [{ message: 'BadRequest' }], data: { createWebhook: null } }));
    const store = memoryStore();
    await expect(handlers.onEnable({ auth: TEST_AUTH, propsValue: {}, webhookUrl: 'https://hook', store })).rejects.toThrow(/BadRequest/);
    expect(store.data.size).toBe(0);
  });

  it('deletes the webhook when the store write fails', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { createWebhook: { id: 'w1' } } })).mockResolvedValueOnce(ok({ data: { deleteWebhook: true } }));
    await expect(handlers.onEnable({ auth: TEST_AUTH, propsValue: {}, webhookUrl: 'https://hook', store: memoryStore({ failPut: true }) })).rejects.toThrow('store down');
    expect(sendRequest.mock.calls[1][0].body.variables).toEqual({ id: 'w1' });
  });

  it('deletes legacy-shaped stored webhooks and treats not found as gone', async () => {
    sendRequest.mockResolvedValueOnce(ok({ errors: [{ message: "NotFound: Entity 'Webhook' was not found.", extensions: { code: '1030' } }], data: { deleteWebhook: null } }));
    const store = memoryStore();
    await store.put('tarvent_contact_added', { data: { createWebhook: { id: 'old1' } } });
    await handlers.onDisable({ auth: TEST_AUTH, store });
    expect(sendRequest.mock.calls[0][0].body.variables).toEqual({ id: 'old1' });
    expect(store.data.has('tarvent_contact_added')).toBe(false);
  });

  it('keeps the stored id when the delete fails for another reason', async () => {
    sendRequest.mockResolvedValueOnce(ok({ errors: [{ message: 'Server error' }] }));
    const store = memoryStore();
    await store.put('tarvent_contact_added', { id: 'w1' });
    await expect(handlers.onDisable({ auth: TEST_AUTH, store })).rejects.toThrow(/Server error/);
    expect(store.data.get('tarvent_contact_added')).toEqual({ id: 'w1' });
  });

  it('keeps the stored id when Tarvent does not confirm the delete', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { deleteWebhook: false } }));
    const store = memoryStore();
    await store.put('tarvent_contact_added', { id: 'w1' });
    await expect(handlers.onDisable({ auth: TEST_AUTH, store })).rejects.toThrow(/did not confirm deleteWebhook/);
    expect(store.data.get('tarvent_contact_added')).toEqual({ id: 'w1' });
  });

  it('drops a retried delivery with the same event id', async () => {
    const store = memoryStore();
    const body = { id: 'evt1', payload: {} };
    expect(await handlers.run({ payload: { body }, store })).toEqual([{ ...body, _dedupe_key: 'evt1' }]);
    expect(await handlers.run({ payload: { body }, store })).toEqual([]);
    expect(await handlers.run({ payload: { body: { id: 'evt2' } }, store })).toHaveLength(1);
  });

  it('bounds the dedupe list', () => {
    const seen = Array.from({ length: tarventWebhook.MAX_SEEN_IDS }, (_, i) => `e${i}`);
    expect(tarventWebhook.rememberEvent({ seen, eventId: 'new' }).seen).toHaveLength(tarventWebhook.MAX_SEEN_IDS);
  });
});

describe('webhook filters', () => {
  it('treats the legacy BOTH campaign type as any campaign', () => {
    expect(tarventWebhook.webhookFilter({ type: 'contactOpened', params: { campaignType: 'BOTH' } })).toBeNull();
  });

  it('applies the specific campaign and link from the top-level props', () => {
    const filter = tarventWebhook.webhookFilter({ type: 'contactClicked', params: { campaignType: 'Specific', campaignId: 'c1', linkId: 'l1' } });
    expect(filter).toMatchObject({ conditions: [{ fieldName: 'Campaign.c1.Clicked.l1', operator: 'IF_TRUE' }] });
  });

  it('applies the landing page filter', () => {
    const filter = tarventWebhook.webhookFilter({ type: 'landingPageCtaPerformed', params: { landingPageId: 'p1' } });
    expect(filter).toMatchObject({ conditions: [{ fieldName: 'Page.p1.CTA' }] });
  });

  it('expands Any bounce type to every bounce event', () => {
    expect(tarventWebhook.webhookEvents({ type: 'contactBounced', params: { type: 'Any', entity: 'CAMPAIGN' } })).toHaveLength(8);
  });
});

describe('data fields', () => {
  it('GDPR fields are real dropdown properties with 1/0 values', async () => {
    sendRequest.mockResolvedValueOnce(ok({ data: { audienceDataFields: { nodes: [
      { id: 'g1', dataType: 'NUMBER', labelText: 'GDPR_Email', required: false, isSystem: true, defaultValue: '', isGdprField: true },
      { id: 'f1', dataType: 'TEXT', labelText: 'Company', required: false, isSystem: false, defaultValue: '', isGdprField: false },
      { id: 's1', dataType: 'TEXT', labelText: 'System', required: false, isSystem: true, defaultValue: '', isGdprField: false },
    ], pageInfo: { hasNextPage: false } } } }));
    const props = await Reflect.apply(tarventCommon.audienceDataFields.props, tarventCommon.audienceDataFields, [{ auth: TEST_AUTH, audienceId: 'a1' }, {}]);
    expect(Object.keys(props)).toEqual(['g1', 'f1']);
    expect(props['g1']).toMatchObject({ type: 'STATIC_DROPDOWN', displayName: 'Email (GDPR Permission)' });
    expect(props['f1']).toMatchObject({ type: 'SHORT_TEXT' });
  });
});
