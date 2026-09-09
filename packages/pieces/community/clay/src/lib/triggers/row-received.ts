import {
    createTrigger,
    Property,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { clayWebhook } from '../common/webhook';

export const rowReceivedTrigger = createTrigger({
    name: 'row_received',
    displayName: 'Row Received from Clay',
    description: 'Triggers when Clay sends a row to this flow.',
    aiMetadata: {
        description:
            'Fires when Clay posts a row to this flow, carrying whatever fields the Clay side was configured to send. Clay has no API for registering webhooks, so somebody has to point a Clay webhook or an HTTP API enrichment column at this trigger\'s URL by hand before it receives anything.',
    },
    type: TriggerStrategy.WEBHOOK,
    requireAuth: false,
    props: {
        setupInstructions: Property.MarkDown({
            value: `
Clay cannot register a webhook for you, so paste this URL into Clay yourself:

\`\`\`text
{{webhookUrl}}
\`\`\`

**Sending rows from a table** is the usual route. Add an **HTTP API** column, then:

1. Set the method to \`POST\` and paste the URL into **Endpoint**. Paste only the URL - typing \`/\` there opens Clay's column picker and corrupts it.
2. Set the **Body** to the columns you want, for example \`{"Domain": "/Domain"}\`.
3. Leave **Signing Secret** below empty. An HTTP API column cannot sign a request, so a secret there rejects every delivery.

**For workspace events**, create a webhook in Clay's settings and paste the URL into its **Webhook URL** field. Its first verification request carries an empty row and is ignored. Optionally put that webhook's \`whsec_...\` secret in **Signing Secret** below.
            `,
        }),
        signingSecret: Property.ShortText({
            displayName: 'Signing Secret',
            description:
                'The whsec_... secret of a webhook created in Clay\'s settings, used to verify every delivery. Leave empty for an HTTP API column, which cannot sign requests.',
            required: false,
        }),
    },
    sampleData: {
        Domain: 'activepieces.com',
        Company: 'Activepieces',
    },

    async onEnable() {
        return;
    },

    async onDisable() {
        return;
    },

    async run(context) {
        const signingSecret = clayWebhook.trimmedSecretOf(
            context.propsValue.signingSecret,
        );

        if (signingSecret) {
            const verified = clayWebhook.verifySignature({
                signingSecret,
                rawBody: context.payload.rawBody,
                signatureHeader: clayWebhook.signatureHeaderOf(
                    context.payload.headers,
                ),
            });
            if (!verified) {
                throw new Error(
                    'The x-clay-signature header did not match the signing secret, so this request was not accepted. Check that Signing Secret matches the secret Clay showed for this webhook, including its whsec_ prefix.',
                );
            }
        }

        if (clayWebhook.isVerificationPing(context.payload.body)) {
            return [];
        }

        return [context.payload.body];
    },
});
