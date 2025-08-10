import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { helpScoutAuth } from '../common/auth';
import { mailboxIdDropdown, userIdDropdown } from '../common/props';
import crypto from 'crypto';
import { helpScoutApiRequest, verifyWebhookSignature } from '../common/api';
import { HttpMethod } from '@activepieces/pieces-common';

const WEBHOOK_KEY = 'helpscout_conversation_created';

export const conversationCreated = createTrigger({
  auth: helpScoutAuth,
  name: 'conversation_created',
  displayName: 'Conversation Created',
  description: 'Triggers when a new conversation is started in a mailbox.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    mailboxId: mailboxIdDropdown(true),
    assignedTo: userIdDropdown('Assigned User'),
  },
  sampleData: {},
  async onEnable(context) {
    const secret = crypto.randomBytes(20).toString('hex');

    const response = await helpScoutApiRequest({
      auth: context.auth,
      method: HttpMethod.POST,
      url: '/webhooks',
      body: {
        url: context.webhookUrl,
        events: ['convo.created'],
        secret,
        mailboxIds: [context.propsValue.mailboxId],
      },
    });

    const webhookId = response.headers?.['resource-id'] as string;

    await context.store.put<{ webhookId: string; WebhookSecret: string }>(
      WEBHOOK_KEY,
      { webhookId: webhookId, WebhookSecret: secret }
    );
  },
  async onDisable(context) {
    const webhookData = await context.store.get<{
      webhookId: string;
      WebhookSecret: string;
    }>(WEBHOOK_KEY);
    if (webhookData?.webhookId) {
      await helpScoutApiRequest({
        method: HttpMethod.DELETE,
        url: `/webhooks/${webhookData.webhookId}`,
        auth: context.auth,
      });
    }
  },
  async run(context) {
    const { assignedTo } = context.propsValue;
    const webhookData = await context.store.get<{
      webhookId: string;
      WebhookSecret: string;
    }>(WEBHOOK_KEY);

    const webhookSecret = webhookData?.WebhookSecret;
    const webhookSignatureHeader =
      context.payload.headers['x-helpscout-signature'];
    const rawBody = context.payload.rawBody;

    if (
      !verifyWebhookSignature(webhookSecret, webhookSignatureHeader, rawBody)
    ) {
      return [];
    }

    const payload = context.payload.body as { assignee: { id: number } };

    if (assignedTo && payload.assignee.id.toString() !== assignedTo) return [];

    return [context.payload.body];
  },
  async test(context) {
    const { mailboxId, assignedTo } = context.propsValue;

    const queryParams: Record<string, any> = { embed: 'threads' };
    if (mailboxId) queryParams['mailbox'] = mailboxId;
    if (assignedTo) queryParams['assigned_to'] = assignedTo;

    const response = await helpScoutApiRequest({
      method: HttpMethod.GET,
      url: '/conversations',
      auth: context.auth,
      queryParams,
    });

    const { _embedded } = response.body as {
      _embedded: {
        conversations: { id: number; subject: string }[];
      };
    };

    return _embedded.conversations;
  },
});
