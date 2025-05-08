import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { beehiivAuth } from '../../index';
import { subscribeWebhook, unsubscribeWebhook } from '../common/webhooks';

const BEEHIIV_EVENT_TYPE = 'post.sent';

export const newPostSent = createTrigger({
    auth: beehiivAuth,
    name: 'beehiiv_new_post_sent',
    displayName: 'New Post Sent',
    description: 'Triggers when a new post is published and sent on Beehiiv.',
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
            BEEHIIV_EVENT_TYPE, // Pass single event type
            context.auth as string,
            context.store
        );
    },
    async onDisable(context) {
        await unsubscribeWebhook(
            context.propsValue.publicationId,
            context.webhookUrl,
            BEEHIIV_EVENT_TYPE, // Pass single event type
            context.auth as string,
            context.store
        );
    },
    async run(context) {
        return [context.payload.body];
    },
    sampleData: {
        id: "post_sample_12345",
        title: "Sample Post: Exciting News!",
        status: "confirmed",
        authors: ["Beehiiv Team"],
        publish_date: 1678886400, // Example: March 15, 2023 12:00:00 PM GMT
        web_url: "https://example.beehiiv.com/p/sample-post-exciting-news",
    },
});
