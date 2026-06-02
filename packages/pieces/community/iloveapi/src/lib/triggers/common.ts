import { Property } from '@activepieces/pieces-framework';

export const webhookInstructions = (eventLabel: string): string => `
**How to connect**

1. Sign in to https://developer.ilovepdf.com/ and open your project.
2. Go to **Webhooks** and click **Add Webhook**.
3. Paste the URL below into **Endpoint URL**:

\`\`\`text
{{webhookUrl}}
\`\`\`

4. In **Events**, select **${eventLabel}**.
5. Save the webhook. The trigger will fire on every matching event.
`;

export const toolFilterProperty = Property.StaticMultiSelectDropdown({
  displayName: 'Filter by Tool',
  description:
    'Optional. When set, only fires for tasks using one of the selected tools. Leave empty to fire for every tool.',
  required: false,
  options: {
    disabled: false,
    options: [
      { label: 'Compress PDF', value: 'compress' },
      { label: 'Merge PDF', value: 'merge' },
      { label: 'Split PDF', value: 'split' },
      { label: 'PDF to JPG', value: 'pdfjpg' },
      { label: 'JPG/Image to PDF', value: 'imagepdf' },
      { label: 'Office to PDF', value: 'officepdf' },
      { label: 'HTML to PDF', value: 'htmlpdf' },
      { label: 'OCR PDF', value: 'pdfocr' },
      { label: 'Watermark PDF', value: 'watermark' },
      { label: 'Protect PDF', value: 'protect' },
      { label: 'Unlock PDF', value: 'unlock' },
      { label: 'Page Numbers', value: 'pagenumber' },
      { label: 'Rotate PDF', value: 'rotate' },
      { label: 'Extract Text', value: 'extract' },
      { label: 'Repair PDF', value: 'repair' },
      { label: 'PDF/A', value: 'pdfa' },
      { label: 'Validate PDF/A', value: 'validatepdfa' },
      { label: 'Edit PDF', value: 'editpdf' },
      { label: 'Sign PDF', value: 'sign' },
    ],
  },
});

type WebhookEnvelope = {
  event?: string;
  data?: {
    task?: { tool?: string } & Record<string, unknown>;
    signature?: Record<string, unknown>;
    signer?: Record<string, unknown>;
  } & Record<string, unknown>;
} & Record<string, unknown>;

export function extractEnvelope(body: unknown): WebhookEnvelope | null {
  if (!body || typeof body !== 'object') return null;
  return body as WebhookEnvelope;
}

export function matchesEvent({
  body,
  expectedEvent,
}: {
  body: unknown;
  expectedEvent: string;
}): WebhookEnvelope | null {
  const envelope = extractEnvelope(body);
  if (!envelope) return null;
  if (envelope.event !== expectedEvent) return null;
  return envelope;
}

export function matchesToolFilter({
  envelope,
  tools,
}: {
  envelope: WebhookEnvelope;
  tools?: string[] | null;
}): boolean {
  if (!tools || tools.length === 0) return true;
  const tool = envelope.data?.task?.tool;
  if (!tool) return false;
  return tools.includes(tool);
}
