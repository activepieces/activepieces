import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpMethod,
} from '@activepieces/pieces-common';
import { transkriptorAuth } from '../auth';
import { BASE_URL } from '../common';

export const transcriptionCompletedTrigger = createTrigger({
  auth: transkriptorAuth,
  name: 'transcription_completed',
  classification: 'READ',
  displayName: 'Transcription Completed',
  description:
    'Triggered when a transcription finishes processing, delivering the transcript content.',
  aiMetadata: {
    description:
      'Fires when Transkriptor finishes transcribing a file, emitting the completed transcript with its order ID, title, language, status, formatted content, and download URL. Requires a manually configured Transkriptor webhook.',
  },
  props: {
    webhookInstructions: Property.MarkDown({
      value: `
## Transkriptor Webhook Setup

To use this trigger, set up a webhook in the Transkriptor API:

1. Copy the webhook URL below:
\`\`\`text
{{webhookUrl}}
\`\`\`
2. Use the Transkriptor API to register a webhook:
   - **Endpoint**: \`POST https://api.tor.app/developer/integrations/webhooks\`
   - **Header**: \`Authorization: Bearer YOUR_API_KEY\`
   - **Body**: \`{ "url": "PASTE_WEBHOOK_URL_HERE" }\`

Or use cURL:
\`\`\`bash
curl -X POST https://api.tor.app/developer/integrations/webhooks \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "PASTE_WEBHOOK_URL_HERE"}'
\`\`\`

**Note**: Transkriptor allows a maximum of 5 webhooks per account, shared across all integrations.
      `,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    order_id: 'abc123',
    title: 'Team standup meeting',
    filename: 'standup-2026-10-26.mp3',
    language: 'en-US',
    status: 'completed',
    formatted_content: 'Speaker 1: Hello everyone...',
    download_url: 'https://example.com/download/abc123',
    content: 'Hello everyone, welcome to the standup...',
  },
  async onEnable() {
    // Webhook is registered manually by the user via the Transkriptor API
  },
  async onDisable() {
    // Webhook is removed manually by the user via the Transkriptor API
  },
  async test(context) {
    const response = await httpClient.sendRequest<
      Array<Record<string, unknown>>
    >({
      url: `${BASE_URL}/files`,
      method: HttpMethod.GET,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth,
      },
      queryParams: {
        limit: '5',
      },
    });

    const files = response.body;

    return files.map((file) => {
      const { parent_folder_id, ...safeFile } = file;
      return safeFile;
    });
  },
  async run(context) {
    const payload = context.payload.body as Record<string, unknown>;

    return [
      {
        order_id: payload['orderID'] ?? payload['order_id'],
        title: payload['title'],
        filename: payload['filename'],
        language: payload['language'],
        status: payload['transcriptionStatus'],
        formatted_content: payload['formattedContent'],
        download_url: payload['downloadURL'],
        transkriptor_url: payload['transkriptorURL'],
        content: payload['content'],
      },
    ];
  },
});
