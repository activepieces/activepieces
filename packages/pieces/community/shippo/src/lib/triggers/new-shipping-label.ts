import { shippoAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import {
    TriggerStrategy,
    createTrigger,
} from '@activepieces/pieces-framework';
import { shippoCommon } from '../common/client';

export const newShippingLabel = createTrigger({
    name: 'new_shipping_label',
    displayName: 'New Shipping Label',
    description: 'Triggers when a new shipping label is created',
    auth: shippoAuth,
    type: TriggerStrategy.WEBHOOK,
    props: {},
    sampleData: {
        object_id: 'label_123456',
        object_created: '2024-01-15T10:30:00Z',
        object_updated: '2024-01-15T10:30:00Z',
        object_owner: 'user_789',
        status: 'SUCCESS',
        tracking_number: '1Z999AA1234567890',
        tracking_status: 'TRANSIT',
        carrier: 'UPS',
        servicelevel: {
            token: 'ups_ground',
            name: 'UPS Ground'
        },
        shipment: {
            object_id: 'shipment_456',
            address_from: {
                name: 'John Doe',
                company: 'Acme Corp',
                street1: '123 Main St',
                city: 'San Francisco',
                state: 'CA',
                zip: '94105',
                country: 'US'
            },
            address_to: {
                name: 'Jane Smith',
                company: 'Tech Inc',
                street1: '456 Oak Ave',
                city: 'New York',
                state: 'NY',
                zip: '10001',
                country: 'US'
            }
        },
        label_url: 'https://shippo-delivery.s3.amazonaws.com/label.pdf',
        commercial_invoice_url: null
    },
    onEnable: async (context) => {
        const { webhookUrl, auth } = context;
        const response = await shippoCommon.apiCall({
            auth,
            method: HttpMethod.POST,
            resourceUri: '/webhooks',
            body: {
                url: webhookUrl,
                events: ['label.created']
            },
        });

        await context.store.put('webhook_id', response.body.object_id);
        return response.body;
    },
    onDisable: async (context) => {
        const { auth } = context;
        const webhookId = await context.store.get('webhook_id');
        if (webhookId) {
            await shippoCommon.apiCall({
                auth,
                method: HttpMethod.DELETE,
                resourceUri: `/webhooks/${webhookId}`,
            });
        }
    },
    run: async (context) => {
        return [context.payload.body];
    },
});
