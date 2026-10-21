import { HttpError, HttpRequest, HttpResponse, httpClient } from '@activepieces/pieces-common';
import { createMockActionContext, createMockPollingTriggerContext, InputPropertyMap } from '@activepieces/pieces-framework';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src';
import { createProductAction } from '../src/lib/actions/create-product';
import { updateCustomerAction } from '../src/lib/actions/update-customer';
import { updateProductAction } from '../src/lib/actions/update-product';
import { newAbandonedCheckout } from '../src/lib/triggers/new-abandoned-checkout';
import { newOrder } from '../src/lib/triggers/new-order';
import { runAction, TEST_AUTH } from './helpers';

const WEBHOOK_URL = 'https://cloud.example.com/api/v1/webhooks/flow-1';
const WEBHOOKS_URL = 'https://test-shop.myshopify.com/admin/api/2026-10/webhooks';

afterEach(() => {
    vi.restoreAllMocks();
});

describe.each([
    { label: 'create_product', action: createProductAction, base: { title: 'Shirt' } },
    { label: 'update_product', action: updateProductAction, base: { id: '1' } },
])('$label status', ({ action, base }) => {
    it('sends the picked status', async () => {
        const sent = mockRest({ replies: [{ body: { product: { id: 1 } } }] });

        await runAction({ action, propsValue: { ...base, productStatus: 'archived' } });

        expect(readBodyField({ request: sent[0], key: 'product' })).toHaveProperty('status', 'archived');
    });

    it('sends no status when none is picked, even if a saved step still holds the old field', async () => {
        const sent = mockRest({ replies: [{ body: { product: { id: 1 } } }] });

        await runAction({ action, propsValue: { ...base, status: 'draft' } });

        expect(readBodyField({ request: sent[0], key: 'product' })).not.toHaveProperty('status');
    });
});

describe('update_customer toggles', () => {
    it('leaves verification, invite and marketing untouched when the toggles are off', async () => {
        const sent = mockRest({ replies: [{ body: { customer: { id: 7 } } }] });

        await runAction({
            action: updateCustomerAction,
            propsValue: { customerId: '7', firstName: 'Ada', verifiedEmail: false, sendEmailInvite: false, acceptsMarketing: false },
        });

        const customer = readBodyField({ request: sent[0], key: 'customer' });
        expect(customer).toHaveProperty('first_name', 'Ada');
        expect(customer).not.toHaveProperty('verified_email');
        expect(customer).not.toHaveProperty('send_email_invite');
        expect(customer).not.toHaveProperty('email_marketing_consent');
    });

    it('sends each setting whose toggle is on', async () => {
        const sent = mockRest({ replies: [{ body: { customer: { id: 7 } } }] });

        await runAction({
            action: updateCustomerAction,
            propsValue: { customerId: '7', verifiedEmail: true, sendEmailInvite: true, acceptsMarketing: true },
        });

        const customer = readBodyField({ request: sent[0], key: 'customer' });
        expect(customer).toHaveProperty('verified_email', true);
        expect(customer).toHaveProperty('send_email_invite', true);
        expect(customer).toHaveProperty('email_marketing_consent', { state: 'subscribed', opt_in_level: 'unknown' });
    });
});

describe('webhook trigger lifecycle', () => {
    it('stores the id of the webhook it creates', async () => {
        mockRest({ replies: [{ body: { webhook: { id: 7, topic: 'orders/create', address: WEBHOOK_URL } } }] });
        const store = createStore({ entries: {} });

        await newOrder.onEnable(webhookContext({ store }));

        expect(store.put).toHaveBeenCalledWith('shopify_webhook_id', 7);
    });

    it('reuses the existing webhook when Shopify reports the address is already registered, as on republish', async () => {
        const sent = mockRest({
            replies: [
                { error: 422 },
                { body: { webhooks: [{ id: 9, topic: 'orders/create', address: WEBHOOK_URL }] } },
            ],
        });
        const store = createStore({ entries: { shopify_webhook_id: 7 } });

        await newOrder.onEnable(webhookContext({ store }));

        expect(sent[1].method).toBe('GET');
        expect(sent[1].url).toBe(`${WEBHOOKS_URL}.json`);
        expect(sent[1].queryParams).toEqual({ topic: 'orders/create', address: WEBHOOK_URL });
        expect(store.put).toHaveBeenCalledWith('shopify_webhook_id', 9);
    });

    it('fails with the original error when no registered webhook matches', async () => {
        mockRest({ replies: [{ error: 422 }, { body: { webhooks: [{ id: 9, topic: 'orders/paid', address: WEBHOOK_URL }] } }] });
        const store = createStore({ entries: {} });

        await expect(newOrder.onEnable(webhookContext({ store }))).rejects.toBeInstanceOf(HttpError);
        expect(store.put).not.toHaveBeenCalled();
    });

    it('does nothing on disable when no webhook id was stored', async () => {
        const sent = mockRest({ replies: [] });
        const store = createStore({ entries: {} });

        await newOrder.onDisable(webhookContext({ store }));

        expect(sent).toHaveLength(0);
        expect(store.delete).not.toHaveBeenCalled();
    });

    it('treats a webhook that is already gone as deleted', async () => {
        const sent = mockRest({ replies: [{ error: 404 }] });
        const store = createStore({ entries: { shopify_webhook_id: 7 } });

        await newOrder.onDisable(webhookContext({ store }));

        expect(sent[0].url).toBe(`${WEBHOOKS_URL}/7.json`);
        expect(store.delete).toHaveBeenCalledWith('shopify_webhook_id');
    });

    it('keeps the stored id when the delete fails for another reason', async () => {
        mockRest({ replies: [{ error: 500 }] });
        const store = createStore({ entries: { shopify_webhook_id: 7 } });

        await expect(newOrder.onDisable(webhookContext({ store }))).rejects.toBeInstanceOf(HttpError);
        expect(store.delete).not.toHaveBeenCalled();
    });
});

describe('new_abandoned_checkout polling', () => {
    it('remembers the newest checkout on enable, whatever order Shopify returns pages in', async () => {
        const firstPage = Array.from({ length: 250 }, (_, index) => ({ id: index + 1 }));
        const sent = mockRest({
            replies: [{ body: { checkouts: firstPage } }, { body: { checkouts: [{ id: 252 }, { id: 251 }] } }],
        });
        const store = createStore({ entries: {} });

        await newAbandonedCheckout.onEnable(pollingContext({ store }));

        expect(sent[0].queryParams).toEqual({ limit: '250' });
        expect(sent[1].queryParams).toEqual({ limit: '250', since_id: '250' });
        expect(store.put).toHaveBeenCalledWith('lastItem', 252);
    });

    it('returns new checkouts newest first and remembers the newest', async () => {
        const sent = mockRest({ replies: [{ body: { checkouts: [{ id: 253 }, { id: 255 }, { id: 254 }] } }] });
        const store = createStore({ entries: { lastItem: 252 } });

        const result = await newAbandonedCheckout.run(pollingContext({ store }));

        expect(sent[0].queryParams).toEqual({ limit: '250', since_id: '252' });
        expect(result).toEqual([{ id: 255 }, { id: 254 }, { id: 253 }]);
        expect(store.put).toHaveBeenCalledWith('lastItem', 255);
    });

    it('reports every checkout that arrives after enabling on an empty store, across pages', async () => {
        const firstPage = Array.from({ length: 250 }, (_, index) => ({ id: index + 1 }));
        const sent = mockRest({
            replies: [
                { body: { checkouts: [] } },
                { body: { checkouts: firstPage } },
                { body: { checkouts: [{ id: 251 }] } },
            ],
        });
        const store = createStore({ entries: {} });

        await newAbandonedCheckout.onEnable(pollingContext({ store }));
        const firstPoll = await newAbandonedCheckout.run(pollingContext({ store }));
        const secondPoll = await newAbandonedCheckout.run(pollingContext({ store }));

        expect(sent[1].queryParams).toEqual({ limit: '250', since_id: '0' });
        expect(sent[2].queryParams).toEqual({ limit: '250', since_id: '250' });
        expect(firstPoll).toHaveLength(250);
        expect(secondPoll).toEqual([{ id: 251 }]);
    });

    it('finishes finding the newest checkout before reporting any, when enable stops at the request cap', async () => {
        const fullPages = Array.from({ length: 41 }, (_, page) => ({
            body: { checkouts: Array.from({ length: 250 }, (_, index) => ({ id: page * 250 + index + 1 })) },
        }));
        const sent = mockRest({
            replies: [...fullPages, { body: { checkouts: [{ id: 10251 }] } }, { body: { checkouts: [{ id: 10252 }] } }],
        });
        const store = createStore({ entries: {} });

        await newAbandonedCheckout.onEnable(pollingContext({ store }));

        expect(sent).toHaveLength(41);
        expect(store.put).toHaveBeenCalledWith('newestCheckoutScanCursor', 10250);
        expect(store.put).not.toHaveBeenCalledWith('lastItem', expect.anything());

        const resumedPoll = await newAbandonedCheckout.run(pollingContext({ store }));
        const nextPoll = await newAbandonedCheckout.run(pollingContext({ store }));

        expect(sent[41].queryParams).toEqual({ limit: '250', since_id: '10250' });
        expect(resumedPoll).toEqual([]);
        expect(store.put).toHaveBeenCalledWith('lastItem', 10251);
        expect(store.delete).toHaveBeenCalledWith('newestCheckoutScanCursor');
        expect(sent[42].queryParams).toEqual({ limit: '250', since_id: '10251' });
        expect(nextPoll).toEqual([{ id: 10252 }]);
    });

    it('reports checkouts created after enabling that the unfinished scan reaches, but not older ones', async () => {
        const oldCheckout = { created_at: '2020-01-01T00:00:00Z' };
        const fullPages = Array.from({ length: 41 }, (_, page) => ({
            body: { checkouts: Array.from({ length: 250 }, (_, index) => ({ id: page * 250 + index + 1, ...oldCheckout })) },
        }));
        const newCheckout = { id: 10252, created_at: '2999-01-01T00:00:00Z' };
        mockRest({
            replies: [...fullPages, { body: { checkouts: [{ id: 10251, ...oldCheckout }, newCheckout] } }],
        });
        const store = createStore({ entries: {} });

        await newAbandonedCheckout.onEnable(pollingContext({ store }));
        const resumedPoll = await newAbandonedCheckout.run(pollingContext({ store }));

        expect(store.put).toHaveBeenCalledWith('newestCheckoutScanEnabledAt', expect.any(Number));
        expect(resumedPoll).toEqual([newCheckout]);
        expect(store.put).toHaveBeenCalledWith('lastItem', 10252);
        expect(store.delete).toHaveBeenCalledWith('newestCheckoutScanEnabledAt');
    });
});

function webhookContext({ store }: { store: ReturnType<typeof createStore> }) {
    return {
        ...createMockActionContext<InputPropertyMap>({ propsValue: {} }),
        auth: TEST_AUTH,
        store,
        webhookUrl: WEBHOOK_URL,
        payload: { body: {}, headers: {}, queryParams: {} },
    };
}

function pollingContext({ store }: { store: ReturnType<typeof createStore> }) {
    return {
        ...createMockPollingTriggerContext<InputPropertyMap>({ propsValue: {} }),
        auth: TEST_AUTH,
        store,
    };
}

function createStore({ entries }: { entries: Record<string, number> }) {
    const data = new Map<string, unknown>(Object.entries(entries));
    return {
        put: vi.fn(async (key: string, value: unknown) => {
            data.set(key, value);
            return value;
        }),
        get: vi.fn(async (key: string) => data.get(key) ?? null),
        delete: vi.fn(async (key: string) => {
            data.delete(key);
        }),
    };
}

function mockRest({ replies }: { replies: RestReply[] }): HttpRequest[] {
    const sent: HttpRequest[] = [];
    const queue = [...replies];
    vi.spyOn(httpClient, 'sendRequest').mockImplementation(async (request: HttpRequest): Promise<HttpResponse> => {
        sent.push(request);
        const reply = queue.shift();
        if (!reply) {
            throw new Error(`unexpected request: ${request.method} ${request.url}`);
        }
        if ('error' in reply) {
            throw new HttpError(request.body, { status: reply.error, responseBody: { errors: 'error' } });
        }
        return { status: 200, headers: {}, body: reply.body };
    });
    return sent;
}

function readBodyField({ request, key }: { request: HttpRequest; key: string }): unknown {
    return isRecord(request.body) ? request.body[key] : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

type RestReply = { body: Record<string, unknown> } | { error: number };
