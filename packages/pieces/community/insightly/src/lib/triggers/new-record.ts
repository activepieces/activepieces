import {
    createTrigger,
    Property,
    TriggerStrategy
} from '@activepieces/pieces-framework';
import { insightlyAuth } from '../common/common';

export const newRecord = createTrigger({
    auth: insightlyAuth,
    name: 'new_record',
    displayName: 'New Record',
    description: 'Fires when a new record is created in Insightly (requires webhook setup)',
    type: TriggerStrategy.WEBHOOK,
    props: {
        objectType: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'The type of Insightly object to monitor for new records',
            required: true,
            options: {
                options: [
                    { label: 'Contact', value: 'Contacts' },
                    { label: 'Lead', value: 'Leads' },
                    { label: 'Opportunity', value: 'Opportunities' },
                    { label: 'Organization', value: 'Organisations' },
                    { label: 'Project', value: 'Projects' },
                    { label: 'Task', value: 'Tasks' },
                    { label: 'Event', value: 'Events' }
                ]
            }
        }),
        webhookUrl: Property.MarkDown({
            value: `
**Webhook URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
**Instructions:**
1.  Go to **System Settings > Workflow Automation** in your Insightly account.
2.  Create a new Workflow Process for the desired **Object Type**.
3.  Set the trigger to **"When a record is created"**.
4.  Under "Immediate Actions," add a new action and select **"Add New Webhook"**.
5.  Paste the webhook URL above into the **URI** field and save the workflow.
            `,
        }),
    },
    async onEnable(context) {
        // Required for WEBHOOK triggers, but we don't need to do anything here
        // The user will manually configure the webhook in Insightly
    },
    async onDisable(context) {
        // Required for WEBHOOK triggers, but we don't need to do anything here
        // The user will manually disable the webhook in Insightly
    },
    async run(context) {
        const payload = context.payload.body as { entity: Record<string, unknown> };
        if (payload && payload.entity) {
            return [payload.entity];
        }
        return [];
    },
    async test(context) {
        // The user needs to trigger the webhook manually from Insightly to test it
        // We can return a sample payload for the test button
        return [
            {
                CONTACT_ID: 123456,
                FIRST_NAME: 'John',
                LAST_NAME: 'Doe',
                EMAIL_ADDRESS: 'john.doe@example.com',
                DATE_CREATED_UTC: new Date().toISOString(),
            }
        ];
    },
    sampleData: {} // Webhook triggers don't need sample data in the same way
});
