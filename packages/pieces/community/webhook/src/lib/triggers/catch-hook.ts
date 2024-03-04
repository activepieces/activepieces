
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';

const message = `
Copy the following URL:
**{{webhookUrl}}**


If you are expecting a reply from this webhook, append **/sync** to the URL.

In that case, you will also have to add an HTTP step with **return response** at the end of your flow.

If the flow takes more than **30 seconds**, it will give a **408 Request Timeout** response.
`;

export const catchRequest = createTrigger({
    name: 'catch_request',
    displayName: 'Catch Request',
    description: 'Receive incoming HTTP/webhooks using any HTTP method such as GET, POST, PUT, DELETE, etc.',
    props: {
        markdown: Property.MarkDown({
            value: message
        }),
    },
    sampleData: null,
    type: TriggerStrategy.WEBHOOK,
    async onEnable() {
        // ignore
    },
    async onDisable() {
        // ignore
    },
    async run(context) {
        return [context.payload]
    }
})