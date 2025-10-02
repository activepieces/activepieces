import { createTrigger, Property, TriggerStrategy } from "@activepieces/pieces-framework";
import { MarkdownVariant } from "@activepieces/shared";
import { insightlyAuth } from "../common/auth";

export const newRecord = createTrigger({
    auth: insightlyAuth,
    name: 'new_record',
    displayName: 'New Record',
    description: 'Fires when a new record is created in Insightly (for a specified object).',
    props: {
        object_type: Property.StaticDropdown({
            displayName: 'Object Type',
            description: 'The type of record to monitor for new entries.',
            required: true,
            options: {
                options: [
                    { label: 'Contact', value: 'Contact' },
                    { label: 'Lead', value: 'Lead' },
                    { label: 'Opportunity', value: 'Opportunity' },
                    { label: 'Organisation', value: 'Organisation' },
                    { label: 'Project', value: 'Project' },
                    { label: 'Task', value: 'Task' },
                ],
            },
        }),
        webhookUrl: Property.MarkDown({
            value: `**Webhook URL:**\n\`\`\`text\n{{webhookUrl}}\n\`\`\``,
            variant: MarkdownVariant.BORDERLESS,
        }),
        instructions: Property.MarkDown({
            variant: MarkdownVariant.INFO,
            value: `
**Manual Setup Required in Insightly**

1.  Copy the **Webhook URL** from the field above.
2.  In your Insightly account, go to **System Settings** (via your profile icon).
3.  Under 'Process Management', click on **Workflows**.
4.  Click **New Workflow Process**.
5.  Select the **Record Type** that matches the 'Object Type' you chose in this trigger (e.g., Contact, Lead) and give your workflow a name.
6.  Set the rule to trigger **'Only when a record is created'**.
7.  Under 'Immediate Actions', click **Add Action** and select **Webhook**.
8.  Paste the webhook URL into the **URL to notify** field.
9.  Click **Save**, then find your new workflow in the list and click **Activate**.
            `,
        }),
    },
    sampleData: {
        "entity": {
            "TASK_ID": 99922875,
            "TITLE": "Follow up with new lead",
            "CATEGORY_ID": 9998895,
            "DUE_DATE": "/Date(1489132800000-0800)/",
            "PUBLICLY_VISIBLE": true,
            "COMPLETED": false,
            "DETAILS": "The lead was very interested in our new product line.",
            "STATUS": "NOT STARTED",
            "PRIORITY": 2,
            "PERCENT_COMPLETE": 0,
            "OWNER_VISIBLE": false,
            "RESPONSIBLE_USER_ID": 999308,
            "OWNER_USER_ID": 999308,
            "DATE_CREATED_UTC": "/Date(1489116850787-0800)/",
            "DATE_UPDATED_UTC": "/Date(1489116850787-0800)/",
            "REMINDER_SENT": false,
            "TASKLINKS": []
        }
    },
    type: TriggerStrategy.WEBHOOK,

    async onEnable() {
        return; 
    },

    async onDisable() {
        return; 
    },


    async run(context) {
        const body = context.payload.body as { entity: unknown };
        if (body && body.entity) {
            return [body.entity];
        }
        return [];
    },
});