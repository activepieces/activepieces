import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../index';
import { subscribeWebhook, unsubscribeWebhook } from '../common/webhooks';

const BEEHIIV_EVENT_TYPE = 'subscription.confirmed';

export const newSubscriptionConfirmed = createTrigger({
    auth: beehiivAuth,
    name: 'beehiiv_new_subscription_confirmed',
    displayName: 'New Subscription Confirmation',
    description: 'Triggers when a new subscriber confirms their subscription.',
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
            context.webhookUrl,
            BEEHIIV_EVENT_TYPE,
            context.auth as string,
            context.store
        );
    },
    async run(context) {
        return [context.payload.body];
    },
    sampleData: {
        id: "sub_sample_xyz789",
        email: "newlyconfirmed@example.com",
        status: "active",
        created: 1678889900,
    },
});
