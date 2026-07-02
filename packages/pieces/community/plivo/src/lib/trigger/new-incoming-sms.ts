import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { createHmac, timingSafeEqual } from 'crypto';
import { plivoAuth } from '../..';

const markdown = `## Plivo Incoming SMS Setup
To use this trigger, point your Plivo number's Message URL at the webhook below:

1. Log in to the Plivo console at https://cx.plivo.com.
2. Open **Messaging → Applications** and create or edit an application.
3. Set the **Message URL** to the following and select method **POST**:
\`\`\`text
{{webhookUrl}}
\`\`\`
4. Under **Phone Numbers**, assign this application to the number that should trigger the flow.

When you disable or delete this flow, clear the Message URL on the Plivo application or number so Plivo stops sending here.
`;

export const plivoNewIncomingSms = createTrigger({
  auth: plivoAuth,
  name: 'new_incoming_sms',
  displayName: 'New Incoming SMS',
  description: 'Triggers when a new SMS message is received',
  aiMetadata: {
    description: 'Fires when an inbound SMS message is received on a Plivo number whose application Message URL points at this webhook. Each event represents one incoming text message with its sender, recipient, body, and metadata.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    markdown: Property.MarkDown({
      value: markdown,
    }),
  },
  sampleData: {
    From: '+14151234567',
    To: '+14157654321',
    Type: 'sms',
    Text: 'Hello from Plivo!',
    MessageUUID: 'db3ce55a-7f1d-11e1-8ea7-1231380bc196',
    MessageIntent: '',
  },
  // Message URL is configured manually in the Plivo console, so there is nothing to register.
  async onEnable() {},
  async onDisable() {},
  async run(context) {
    const params = context.payload.body;
    if (!isRecord(params)) {
      return [];
    }

    const headers = context.payload.headers;
    const signatureHeader = headers['x-plivo-signature-v3'];
    const nonce = headers['x-plivo-signature-v3-nonce'];
    if (signatureHeader && nonce) {
      const valid = isValidPlivoSignature({
        url: context.webhookUrl,
        body: params,
        signatureHeader,
        nonce,
        authToken: context.auth.password,
      });
      if (!valid) {
        return [];
      }
    }

    if (typeof params['Text'] !== 'string') {
      return [];
    }

    return [params];
  },
});

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isValidPlivoSignature(params: {
  url: string;
  body: Record<string, unknown>;
  signatureHeader: string;
  nonce: string;
  authToken: string;
}): boolean {
  const { url, body, signatureHeader, nonce, authToken } = params;
  const sortedParams = Object.keys(body)
    .sort()
    .map((key) => `${key}${String(body[key])}`)
    .join('');
  const expected = createHmac('sha256', authToken)
    .update(`${url}${sortedParams}.${nonce}`)
    .digest('base64');
  const expectedBuffer = Buffer.from(expected);
  return signatureHeader.split(',').some((candidate) => {
    const candidateBuffer = Buffer.from(candidate.trim());
    return (
      candidateBuffer.length === expectedBuffer.length &&
      timingSafeEqual(candidateBuffer, expectedBuffer)
    );
  });
}
