import {
    createTrigger,
    Property,
    TriggerStrategy
} from '@activepieces/pieces-framework';
import { insightlyAuth } from '../common/common';

export const updatedRecord = createTrigger({
    auth: insightlyAuth,
    name: 'updated_record',
    displayName: 'Updated Record',
    description: 'Fires when an existing record is updated in Insightly (requires webhook setup)',
    type: TriggerStrategy.WEBHOOK,
    props: {
        objectType: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'The type of Insightly object to monitor for updates',
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
3.  Set the trigger to **"When a record is created and when a record is edited"**.
4.  Under "Immediate Actions," add a new action and select **"Add New Webhook"**.
5.  Paste the webhook URL above into the **URI** field and save the workflow.
            `,
        }),
    },
    async onEnable(context) {
        // Required for WEBHOOK triggers
    },
    async onDisable(context) {
        // Required for WEBHOOK triggers
    },
    async run(context) {
        const payload = context.payload.body as { entity: Record<string, unknown> };
        if (payload && payload.entity) {
            // Optional: Add a check to ensure it's not a new record if needed
            // For now, we'll pass through any update event
            return [payload.entity];
        }
        return [];
    },
    async test(context) {
        return [
            {
                CONTACT_ID: 123456,
                FIRST_NAME: 'John',
                LAST_NAME: 'Doe',
                EMAIL_ADDRESS: 'john.doe.updated@example.com',
                DATE_CREATED_UTC: '2025-10-03T23:29:42.815Z',
                DATE_UPDATED_UTC: new Date().toISOString(),
            }
        ];
    },
    sampleData: {}
});
