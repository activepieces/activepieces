import {
  createTrigger,
  PieceAuth,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';

const markdown = `
- Paste this URL in the webhook integration endpoint:
\`\`\`text
{{webhookUrl}}
\`\`\`
- Click update (keep other settings unchanged)
<br>
<br>

_[Read more about configuring webhooks](https://simplepdf.eu/help/how-to/configure-webhooks-pdf-form-submissions)_
`;

export const simplePDFNewSubmission = createTrigger({
  name: 'new-submission',
  displayName: 'New Submission',
  auth: PieceAuth.None(),
  description: 'Triggers when a form receives a new submission',
  aiMetadata: {
    description:
      'Fires when an end user submits a SimplePDF form, delivering the completed PDF submission via webhook. The event represents a single form submission and includes the source document (id and name), the submission (id, submitted_at timestamp, and a URL to the filled PDF), and any context such as environment and customer_id.',
  },
  props: {
    md: Property.MarkDown({
      value: markdown,
    }),
  },
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    document: {
      id: 'b7615a68-9e1f-4eac-bd20-5e80632a4d9e',
      name: 'your_document.pdf',
    },
    submission: {
      id: '80146d5b-a068-490f-8eb9-fe393ba11396',
      submitted_at: '2023-06-04T11:54:58.995Z',
      url: 'https://cdn.simplepdf.eu/simple-pdf/assets/webhooks-playground.pdf',
    },
    context: {
      environment: 'production',
      customer_id: '123',
    },
  },
  async onEnable(context) {
    // Empty
  },
  async onDisable(context) {
    // Empty
  },
  async run(context) {
    const payloadBody = context.payload.body as
      | Record<string, unknown>
      | undefined;
    return [payloadBody?.['data'] ?? {}];
  },
});
