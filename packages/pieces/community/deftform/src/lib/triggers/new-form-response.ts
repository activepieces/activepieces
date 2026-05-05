import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { deftformAuth } from '../auth';

const setupMarkdown = `
**Setup instructions:**
1. In your Deftform workspace go to **Settings → Notifications / Connections**.
2. Under **Webhook**, click **ADD ENDPOINT** and paste the URL below:
\`\`\`
{{webhookUrl}}
\`\`\`
3. Save the endpoint, then open the form you want to watch, go to its **Notifications / Connections** tab, and enable the webhook you just created.
`;

export const newFormResponseTrigger = createTrigger({
    auth: deftformAuth,
    name: 'new_form_response',
    displayName: 'New Form Response',
    description: 'Triggers instantly when a new response is submitted to a Deftform form.',
    props: {
        instructions: Property.MarkDown({ value: setupMarkdown }),
    },
    sampleData: {
        data: [
            [
                { label: 'Full name', response: 'John Doe', uuid: '6403fc2b-6d52-4231-b63f-db6ea9f651dd', custom_key: 'full_name' },
                { label: 'Email address', response: 'john@example.com', uuid: '6403fc2b-6d52-4231-b63f-db6ea9f651de', custom_key: 'email_address' },
            ],
        ],
    },
    type: TriggerStrategy.WEBHOOK,
    async onEnable(_context) {
        // Webhook URL is pasted manually into Deftform workspace settings.
    },
    async onDisable(_context) {
        // Nothing to unregister.
    },
    async run(context) {
        return [context.payload.body];
    },
});
