import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { extractaAiAuth } from '../common/auth';
import crypto from 'crypto';

export const extractionFailed = createTrigger({
  auth: extractaAiAuth,
  name: 'extraction_failed',
  displayName: 'Extraction Failed',
  description: 'Triggers when a document extraction fails.',
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
To use this trigger, you need to manually set up a single webhook endpoint in your Extracta.ai account. This endpoint will receive all events, and Activepieces will filter for the correct one.

1.  **Login** to your Extracta.ai dashboard.
2.  Navigate to the **API** section from the side menu.
3.  Scroll down to **Webhook Settings**.
4.  Click **"Create a new webhook"** (or edit an existing one).
5.  Paste the following URL into the **Endpoint URL** field:
    \`\`\`text
    {{webhookUrl}}
    \`\`\`
6.  Click **Save**.

This single webhook will now send all events to Activepieces. This trigger will only activate for the **'extraction.failed'** event.
      `,
    }),
  },
  sampleData: {
    event: 'extraction.failed',
    result: [
      {
        extractionId: 'extraction_123',
        batchId: 'batch_456',
        fileId: 'file_789',
        fileName: 'document.pdf',
        status: 'failed',
        error: 'Processing error occurred',
        url: 'https://example.com/file.pdf',
      },
    ],
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    // Does nothing
  },
  async onDisable(context) {
    // Does nothing
  },
  async run(context) {
    const apiKey = context.auth;
    const signatureHeader = context.payload.headers['x-webhook-signature'];
    const body = context.payload.body as any;

    if (signatureHeader && body.result) {
      try {
        const resultString = JSON.stringify(body.result);
        const secretKey = apiKey.replace('E_AI_K_', '');
        const expectedSignature = crypto
          .createHmac('sha256', secretKey)
          .update(resultString)
          .digest('base64');

        if (expectedSignature !== signatureHeader) {
          console.warn('Extracta.ai webhook signature verification failed');
          return [];
        }
      } catch (error) {
        console.warn('Error verifying webhook signature:', error);
        return [];
      }
    }

    if (body.event === 'extraction.failed' && body.result) {
      return [body.result];
    }

    return [];
  },
});
