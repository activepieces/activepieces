import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@activepieces/pieces-common', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@activepieces/pieces-common')>();
    return {
        ...actual,
        httpClient: { sendRequest: vi.fn() },
    };
});

import { HttpRequest, httpClient } from '@activepieces/pieces-common';
import { companyChanged } from '../src/lib/triggers/company-changed';
import { naceEvent } from '../src/lib/triggers/nace-event';

const sendRequest = httpClient.sendRequest as ReturnType<typeof vi.fn>;

const AUTH = {
    type: 'CUSTOM_AUTH',
    props: { apiKey: 'test-key-123', baseUrl: 'https://firmaradar.example' },
};

const fixture = (name: string): unknown =>
    JSON.parse(readFileSync(join(__dirname, 'fixtures', name), 'utf-8'));

/** Minimal webhook-trigger hook context with an in-memory store. */
function triggerContext(propsValue: Record<string, unknown>, payloadBody?: unknown) {
    const stored = new Map<string, unknown>();
    const context = {
        auth: AUTH,
        propsValue,
        webhookUrl: 'https://cloud.activepieces.com/api/v1/webhooks/flow-abc',
        payload: { body: payloadBody, headers: {}, queryParams: {} },
        store: {
            put: async (key: string, value: unknown) => {
                stored.set(key, value);
                return value;
            },
            get: async (key: string) => stored.get(key) ?? null,
            delete: async (key: string) => {
                stored.delete(key);
            },
        },
    };
    return { context, stored };
}

const lastRequest = (): HttpRequest => sendRequest.mock.calls.at(-1)?.[0] as HttpRequest;

beforeEach(() => {
    sendRequest.mockReset();
});

describe('company_changed trigger', () => {
    it('onEnable subscribes with the flow webhook URL and stores the id', async () => {
        respond(fixture('monitoring-webhook-created.json'));
        const { context, stored } = triggerContext({ orgnr: '923609016', deliverySecret: 's3cret' });
        await companyChanged.onEnable(context as never);
        const request = lastRequest();
        expect(request.method).toBe('POST');
        expect(request.url).toBe('https://firmaradar.example/api/v1/monitoring/webhooks');
        expect(request.body).toEqual({
            orgnr: '923609016',
            url: 'https://cloud.activepieces.com/api/v1/webhooks/flow-abc',
            delivery_key: 's3cret',
        });
        expect(stored.get('firmaradar_company_changed_subscription')).toEqual({ id: 42 });
    });

    it('onEnable fails loudly when no subscription id is returned', async () => {
        respond({ ok: true });
        const { context } = triggerContext({ orgnr: '923609016' });
        await expect(companyChanged.onEnable(context as never)).rejects.toThrow(/subscription id/);
    });

    it('onDisable deletes the stored subscription', async () => {
        respond(fixture('monitoring-webhook-created.json'));
        const { context, stored } = triggerContext({ orgnr: '923609016' });
        await companyChanged.onEnable(context as never);
        respond({ ok: true });
        await companyChanged.onDisable(context as never);
        const request = lastRequest();
        expect(request.method).toBe('DELETE');
        expect(request.url).toBe('https://firmaradar.example/api/v1/monitoring/webhooks/42');
        expect(stored.size).toBe(0);
    });

    it('onDisable treats 404 as already unsubscribed', async () => {
        respond(fixture('monitoring-webhook-created.json'));
        const { context, stored } = triggerContext({ orgnr: '923609016' });
        await companyChanged.onEnable(context as never);
        sendRequest.mockRejectedValueOnce({ response: { status: 404 } });
        await expect(companyChanged.onDisable(context as never)).resolves.toBeUndefined();
        expect(stored.size).toBe(0);
    });

    it('onDisable is a no-op without a stored subscription', async () => {
        const { context } = triggerContext({ orgnr: '923609016' });
        await companyChanged.onDisable(context as never);
        expect(sendRequest).not.toHaveBeenCalled();
    });

    it('run forwards the delivery payload as one flow item', async () => {
        const delivery = { event: 'monitoring.changes_detected', changes: [] };
        const { context } = triggerContext({ orgnr: '923609016' }, delivery);
        await expect(companyChanged.run(context as never)).resolves.toEqual([delivery]);
    });
});

describe('nace_event trigger', () => {
    it('onEnable subscribes with filters and stores subscription.id', async () => {
        respond(fixture('nace-subscription-created.json'));
        const { context, stored } = triggerContext({
            naceCode: '47.110',
            events: ['created'],
            aggregationMode: 'real_time',
            fylkeFilter: ['03'],
            kommuneFilter: [],
            minAnsatte: 5,
            deliverySecret: 'token-1',
        });
        await naceEvent.onEnable(context as never);
        const request = lastRequest();
        expect(request.url).toBe('https://firmaradar.example/api/v1/nace/subscriptions');
        expect(request.body).toEqual({
            nace_code: '47.110',
            url: 'https://cloud.activepieces.com/api/v1/webhooks/flow-abc',
            bearer_token: 'token-1',
            aggregation_mode: 'real_time',
            events: ['created'],
            fylke_filter: ['03'],
            min_ansatte: 5,
        });
        expect(stored.get('firmaradar_nace_event_subscription')).toEqual({ id: 7 });
    });

    it('onDisable deletes the stored NACE subscription', async () => {
        respond(fixture('nace-subscription-created.json'));
        const { context, stored } = triggerContext({ naceCode: '47.110' });
        await naceEvent.onEnable(context as never);
        respond({ deleted: true, id: 7 });
        await naceEvent.onDisable(context as never);
        const request = lastRequest();
        expect(request.method).toBe('DELETE');
        expect(request.url).toBe('https://firmaradar.example/api/v1/nace/subscriptions/7');
        expect(stored.size).toBe(0);
    });

    it('run forwards the delivery payload as one flow item', async () => {
        const delivery = { event_type: 'created', orgnr: '923609016' };
        const { context } = triggerContext({ naceCode: '47.110' }, delivery);
        await expect(naceEvent.run(context as never)).resolves.toEqual([delivery]);
    });
});

function respond(body: unknown, status = 200) {
    sendRequest.mockResolvedValueOnce({ status, body, headers: {} });
}
