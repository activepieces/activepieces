import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { firmaradarAuth } from '../common/auth';
import { firmaradarRequest, isNotFoundError } from '../common/client';
import { buildNaceSubscriptionBody, extractSubscriptionId } from '../common/parse';

const STORE_KEY = 'firmaradar_nace_event_subscription';

/**
 * Instant trigger backed by NACE industry monitoring
 * (`POST /api/v1/nace/subscriptions` — see
 * docs/integrasjoner/WEBHOOK_TRIGGERS.md). The subscription id lives under
 * `subscription.id` in the create response; deliveries are
 * NaceEventDelivery payloads (HMAC-signed via `X-Firmaradar-Signature`).
 */
export const naceEvent = createTrigger({
    name: 'nace_event',
    auth: firmaradarAuth,
    displayName: 'Industry Event (NACE)',
    description:
        'Fires when any company in a NACE industry code is created, updated, ' +
        'deleted or changes status — with geography and size filters. Watch a ' +
        'whole market instead of one company. Requires company monitoring ' +
        '(firmaovervåkning) on the account.',
    type: TriggerStrategy.WEBHOOK,
    props: {
        naceCode: Property.ShortText({
            displayName: 'NACE Code',
            description: 'Section (G), division (47) or full code (47.110).',
            required: true,
        }),
        events: Property.StaticMultiSelectDropdown({
            displayName: 'Event Types',
            description: 'Event types to deliver. Leave empty for all types.',
            required: false,
            options: {
                options: [
                    { label: 'Created', value: 'created' },
                    { label: 'Updated', value: 'updated' },
                    { label: 'Deleted', value: 'deleted' },
                    { label: 'Status changed', value: 'status_changed' },
                ],
            },
        }),
        aggregationMode: Property.StaticDropdown({
            displayName: 'Aggregation',
            required: false,
            defaultValue: 'real_time',
            options: {
                options: [
                    { label: 'Real time', value: 'real_time' },
                    { label: 'Hourly digest', value: 'hourly_digest' },
                    { label: 'Daily digest', value: 'daily_digest' },
                ],
            },
        }),
        fylkeFilter: Property.Array({
            displayName: 'County Codes',
            description: 'Optional county (fylke) codes, e.g. 03, 11.',
            required: false,
        }),
        kommuneFilter: Property.Array({
            displayName: 'Municipality Codes',
            description: 'Optional four-digit municipality codes, e.g. 0301.',
            required: false,
        }),
        landsdelFilter: Property.Array({
            displayName: 'Region Filter',
            description: 'Optional region (landsdel) names, e.g. Østlandet.',
            required: false,
        }),
        minAnsatte: Property.Number({
            displayName: 'Minimum Employees',
            required: false,
        }),
        minOmsetningNok: Property.Number({
            displayName: 'Minimum Revenue (NOK)',
            required: false,
        }),
        deliverySecret: Property.ShortText({
            displayName: 'Delivery Secret',
            description:
                'Optional secret Firmaradar sends back as `Authorization: Bearer` ' +
                'on every delivery, so you can verify the sender.',
            required: false,
        }),
    },
    sampleData: {
        event_type: 'created',
        orgnr: '923609016',
        navn: 'Eksempel AS',
        nace_code: '47.110',
        kommunenr: '0301',
        announcement: null,
        delivered_via: 'nace_overvakning',
    },
    async onEnable(context) {
        const response = await firmaradarRequest<Record<string, unknown>>(context.auth, {
            method: HttpMethod.POST,
            path: '/api/v1/nace/subscriptions',
            body: buildNaceSubscriptionBody({
                naceCode: context.propsValue.naceCode,
                url: context.webhookUrl,
                events: (context.propsValue.events ?? []) as string[],
                aggregationMode: context.propsValue.aggregationMode,
                fylkeFilter: context.propsValue.fylkeFilter,
                kommuneFilter: context.propsValue.kommuneFilter,
                landsdelFilter: context.propsValue.landsdelFilter,
                minAnsatte: context.propsValue.minAnsatte,
                minOmsetningNok: context.propsValue.minOmsetningNok,
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
                path: `/api/v1/nace/subscriptions/${saved.id}`,
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
        return [context.payload.body];
    },
});
