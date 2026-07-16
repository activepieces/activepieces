import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest, isNotFoundError } from '../common/client';
import {
    buildMonitoringWebhookBody,
    extractSubscriptionId,
    isAuthenticDelivery,
} from '../common/parse';
import { orgnrProp } from '../common/props';

const STORE_KEY = 'firmaradar_company_changed_subscription';

/**
 * Instant trigger backed by per-orgnr company monitoring
 * (`POST /api/v1/monitoring/webhooks` — see
 * docs/integrasjoner/WEBHOOK_TRIGGERS.md). Subscribe on enable,
 * unsubscribe (DELETE) on disable; the delivery payload is a
 * MonitoringChangeEvent.
 */
export const companyChanged = createTrigger({
    name: 'company_changed',
    auth: firmaradarAuth,
    displayName: 'Company Changed',
    description:
        'Fires when a monitored company gets a new BRREG announcement, an ' +
        'ownership change or a public-grant change — the building block for ' +
        'KYC re-screening and supplier-risk monitoring flows. Requires company ' +
        'monitoring (firmaovervåkning) on the account.',
    type: TriggerStrategy.WEBHOOK,
    props: {
        orgnr: orgnrProp('Nine-digit Norwegian organisation number to monitor.'),
        deliverySecret: Property.ShortText({
            displayName: 'Delivery Secret',
            description:
                'Optional secret Firmaradar sends back as `Authorization: Bearer` ' +
                'on every delivery, so you can verify the sender.',
            required: false,
        }),
    },
    sampleData: {
        event: 'monitoring.changes_detected',
        generated_at: '2026-07-01T06:30:00Z',
        artifact_date: '2026-07-01',
        changes: [
            {
                orgnr: '923609016',
                company_name: 'Eksempel AS',
                change_type: 'kunngjoring',
                category: 'Konkurs',
                description: 'Ny kunngjøring: åpning av konkurs',
                previous_value: null,
                new_value: null,
            },
        ],
    },
    async onEnable(context) {
        const response = await firmaradarRequest<Record<string, unknown>>(context.auth, {
            method: HttpMethod.POST,
            path: '/api/v1/monitoring/webhooks',
            body: buildMonitoringWebhookBody({
                orgnr: context.propsValue.orgnr,
                url: context.webhookUrl,
                deliverySecret: context.propsValue.deliverySecret,
            }),
        });
        const id = extractSubscriptionId(response);
        if (id === undefined) {
            throw new Error('Firmaradar did not return a subscription id on create.');
        }
        await context.store.put(STORE_KEY, { id });
    },
    async onDisable(context) {
        const saved = await context.store.get<{ id: number | string }>(STORE_KEY);
        if (!saved) {
            return;
        }
        try {
            await firmaradarRequest(context.auth, {
                method: HttpMethod.DELETE,
                path: `/api/v1/monitoring/webhooks/${saved.id}`,
            });
        } catch (error) {
            // 404 = subscription already gone; treat as success.
            if (!isNotFoundError(error)) {
                throw error;
            }
        }
        await context.store.delete(STORE_KEY);
    },
    async run(context) {
        // With a delivery secret configured, only accept deliveries carrying
        // the matching Authorization: Bearer header.
        if (!isAuthenticDelivery(context.propsValue.deliverySecret, context.payload.headers)) {
            return [];
        }
        return [context.payload.body];
    },
});
