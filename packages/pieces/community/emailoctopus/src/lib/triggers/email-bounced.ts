import { Property, TriggerStrategy, createTrigger } from "@activepieces/pieces-framework";
import { emailOctopusAuth } from "../common/auth";
import { emailOctopusProps } from "../common/props";

export const emailBounced = createTrigger({
    auth: emailOctopusAuth,
    name: 'email_bounced',
    displayName: 'Email Bounced',
    description: 'Fires when an email to a recipient bounces from a specific campaign.',
    props: {
        campaign_id: emailOctopusProps.campaignId(),
        instructions: Property.MarkDown({
            value: `
            **Manual Setup Required**

            1. Go to your EmailOctopus Dashboard.
            2. Navigate to **API & Integrations**, then select the **Webhooks** tab.
            3. Click **Add webhook**.
            4. Paste the URL below into the **URL** field:
               \`\`\`
               {{webhookUrl}}
               \`\`\`
            5. Select the **Contact bounced** event.
            6. Click **Add webhook**.
            `,
        }),
    },
    type: TriggerStrategy.WEBHOOK,
    sampleData: {
        "id": "42636763-73f9-463e-af8b-3f720bb3d889",
        "type": "contact.bounced",
        "list_id": "fa482fa2-5ac4-11ed-9f7a-67da1c836cf8",
        "contact_id": "e3ab8c80-5f65-11ed-835e-030e4bb63150",
        "occurred_at": "2022-11-18T15:20:23+00:00",
        "contact_email_address": "user@example.com",
        "contact_status": "BOUNCED",
        "campaign_id": "12345678-1234-1234-1234-123456789abc"
    },

    async onEnable(context) { return },
    async onDisable(context) { return },

    async run(context) {
        const payloadBody = context.payload.body as { type: string; campaign_id: string };
        const campaignIdFilter = context.propsValue.campaign_id;

        if (payloadBody.type !== 'contact.bounced') {
            return [];
        }

        if (campaignIdFilter && payloadBody.campaign_id !== campaignIdFilter) {
            return [];
        }

        return [payloadBody];
    },
});