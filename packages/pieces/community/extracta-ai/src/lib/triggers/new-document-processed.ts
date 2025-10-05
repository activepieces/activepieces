import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { extractaAiAuth } from '../common/auth';
import crypto from 'crypto';

export const newDocumentProcessed = createTrigger({
  auth: extractaAiAuth,
  name: 'new_document_processed',
  displayName: 'New Document Processed',
  description: 'Triggers when a document extraction is successfully processed. Configure the webhook URL in your Extracta.ai dashboard.',
  props: {},
  sampleData: {
    event: 'extraction.processed',
    result: [
      {
        extractionId: 'extraction_123',
        batchId: 'batch_456',
        fileId: 'file_789',
        fileName: 'document.pdf',
        status: 'processed',
        result: {
          field1: 'value1',
          field2: 'value2',
        },
        url: 'https://example.com/file.pdf',
      },
    ],
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable() {
    // Webhook is configured in Extracta.ai dashboard, no registration needed
  },
  async onDisable() {
    // Webhook is managed in Extracta.ai dashboard, no cleanup needed
  },
  async run(context) {
    const apiKey = context.auth;
    const signatureHeader = context.payload.headers['x-webhook-signature'];
    const body = context.payload.body as any;

    // Verify webhook signature
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

    // Only process extraction.processed events
    if (body.event === 'extraction.processed' && body.result) {
      return body.result;
    }

    return [];
  },
});
