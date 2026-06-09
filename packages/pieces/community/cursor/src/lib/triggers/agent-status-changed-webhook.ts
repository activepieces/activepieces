import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { cursorAuth } from '../common/auth';
import crypto from 'crypto';

interface WebhookPayload {
  event: string;
  timestamp: string;
  id: string;
  status: string;
  source?: {
    repository?: string;
    ref?: string;
  };
  target?: {
    url?: string;
    branchName?: string;
    prUrl?: string;
  };
  summary?: string;
}

function verifyWebhookSignature(
  secret: string,
  rawBody: string | Buffer,
  signatureHeader: string | undefined
): boolean {
  if (!signatureHeader || !secret) {
    return false;
  }

  try {
    const signature = signatureHeader.replace('sha256=', '');
    
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawBody)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    return false;
  }
}

export const agentStatusChangedWebhookTrigger = createTrigger({
  auth: cursorAuth,
  name: 'agent_status_changed_webhook',
  displayName: 'Agent Status Changed (Webhook)',
  description: 'Triggers when an agent status changes (ERROR or FINISHED). Configure this webhook URL when launching an agent.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    webhookSecret: Property.ShortText({
      displayName: 'Webhook Secret',
      description: 'Optional webhook secret for signature verification. Must match the secret used when launching the agent.',
      required: false,
    }),
  },
  sampleData: {
    event: 'statusChange',
    timestamp: '2024-01-15T10:30:00Z',
    id: 'bc_abc123',
    status: 'FINISHED',
    source: {
      repository: 'https://github.com/your-org/your-repo',
      ref: 'main',
    },
    target: {
      url: 'https://cursor.com/agents?id=bc_abc123',
      branchName: 'cursor/add-readme-1234',
      prUrl: 'https://github.com/your-org/your-repo/pull/1234',
    },
    summary: 'Added README.md with installation instructions',
  },
  async onEnable(context) {
    if (context.propsValue.webhookSecret) {
      await context.store.put('webhook_secret', context.propsValue.webhookSecret);
    }
  },
  async onDisable(context) {
    await context.store.delete('webhook_secret');
  },
  async run(context) {
    const headers = context.payload.headers || {};
    const rawBody = context.payload.rawBody;
    const signatureHeader = headers['x-webhook-signature'] || headers['X-Webhook-Signature'];
    const eventHeader = headers['x-webhook-event'] || headers['X-Webhook-Event'];
    
    const webhookSecret = context.propsValue.webhookSecret || 
      (await context.store.get<string>('webhook_secret'));

    if (webhookSecret) {
      if (!signatureHeader) {
        throw new Error('Webhook signature header is missing. This request may not be from Cursor.');
      }

      if (!verifyWebhookSignature(webhookSecret, rawBody as string, signatureHeader)) {
        throw new Error('Webhook signature verification failed. This request may not be from Cursor.');
      }
    }

    const payload = context.payload.body as WebhookPayload;

    if (eventHeader !== 'statusChange' && payload.event !== 'statusChange') {
      return [];
    }

    if (payload.status !== 'ERROR' && payload.status !== 'FINISHED') {
      return [];
    }

    return [payload];
  },
});

