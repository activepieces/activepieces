import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../index';
import { subscribeWebhook, unsubscribeWebhook } from '../common/webhooks';

const BEEHIIV_EVENT_TYPE = 'subscription.deleted'; // Changed event type

export const userUnsubscribes = createTrigger({
    auth: beehiivAuth,
    name: 'beehiiv_user_unsubscribes', // Changed name
    displayName: 'User Unsubscribes', // Changed display name
    description: 'Triggers when a user unsubscribes from a Beehiiv publication.', // Changed description
    props: {
        publicationId: Property.ShortText({
            displayName: 'Publication ID',
            description: 'The ID of your Beehiiv publication (e.g., pub_xxxxxxxx).',
            required: true,
        }),
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
        await subscribeWebhook(
            context.propsValue.publicationId,
            context.webhookUrl,
            BEEHIIV_EVENT_TYPE,
            context.auth as string,
            context.store
        );
    },
    async onDisable(context) {
        await unsubscribeWebhook(
            context.propsValue.publicationId,
            context.webhookUrl, // Added webhookUrl
            BEEHIIV_EVENT_TYPE,
            context.auth as string,
            context.store
        );
    },
    async run(context) {
        // The payload for subscription.deleted might contain the subscription object
        return [context.payload.body];
    },
    sampleData: { // Updated sample data
        id: "sub_sample_abcdef",
        email: "subscriber@example.com",
        status: "inactive", // Typically 'inactive' or similar after unsubscribe
        created: 1678880000,
    },
});
