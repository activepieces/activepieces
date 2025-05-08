import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../index';
import { subscribeWebhook, unsubscribeWebhook } from '../common/webhooks';

const BEEHIIV_EVENT_TYPE = 'subscription.deleted';

export const userUnsubscribes = createTrigger({
    auth: beehiivAuth,
    name: 'beehiiv_user_unsubscribes',
    displayName: 'User Unsubscribes',
    description: 'Triggers when a user unsubscribes from a Beehiiv publication.',
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
        id: "sub_sample_abcdef",
        email: "subscriber@example.com",
        status: "inactive",
        created: 1678880000,
    },
});
