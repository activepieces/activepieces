import {
    createTrigger,
    Property,
    TriggerStrategy,
} from '@activepieces/pieces-framework';
import { clayAuth } from '../auth';
import { clayWebhook } from '../common/webhook';

export const rowReceivedTrigger = createTrigger({
    auth: clayAuth,
    name: 'row_received',
    displayName: 'Row Received from Clay',
    description: 'Triggers when Clay sends a row to this flow.',
    aiMetadata: {
        description:
            'Fires when Clay posts a row to this flow, carrying whatever fields the Clay side was configured to send. Clay has no API for registering webhooks, so somebody has to point a Clay webhook or an HTTP API enrichment column at this trigger\'s URL by hand before it receives anything.',
    },
    type: TriggerStrategy.WEBHOOK,
    props: {
        setupInstructions: Property.MarkDown({
            value: `
Clay has no API for registering webhooks, so point Clay at this flow yourself. Copy this URL:

\`\`\`text
{{webhookUrl}}
\`\`\`

Then use whichever route suits you. They behave differently, so the choice matters.

**To send rows from a table - add an HTTP API column.** This is the usual choice.

- Set the method to \`POST\` and paste the URL into **Endpoint**. Put nothing else in that field: typing \`/\` there opens Clay's column picker, and an inserted column silently corrupts the URL.
- Set the **Body** to the columns you want, for example \`{"Domain": "/Domain"}\`. With an empty body nothing useful arrives.
- Leave **Signing Secret** below **empty**. Clay's HTTP API column cannot sign a request, so a secret there rejects every delivery.

**To receive workspace events - create a webhook in Clay's settings.**

- Paste the URL into Clay's **Webhook URL** field.
- Clay immediately sends a signed verification request carrying an empty row. This trigger ignores it, so it will not start a run.
- Optionally paste that webhook's \`whsec_...\` secret into **Signing Secret** below, and every delivery's signature is then checked.

The fields you receive are whatever Clay sends, so they follow your own table's columns rather than a fixed shape.
            `,
        }),
        signingSecret: Property.ShortText({
            displayName: 'Signing Secret',
            description:
                'Only for a webhook created in Clay\'s settings, which signs each delivery with an x-clay-signature header. Paste that webhook\'s whsec_... secret to have every delivery verified and anything unsigned rejected.\n\nLeave this empty when Clay reaches this flow through a table\'s HTTP API column. That column is a general-purpose HTTP request builder and cannot compute a signature, so a secret here would reject every delivery it sends.',
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
        const { signingSecret } = context.propsValue;

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
