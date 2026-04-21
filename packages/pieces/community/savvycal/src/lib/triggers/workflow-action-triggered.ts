import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, verifyWebhookSignature } from '../common';
import { savvyCalAuth } from '../../';

export const workflowActionTriggeredTrigger = createTrigger({
  auth: savvyCalAuth,
  name: 'workflow_action_triggered',
  displayName: 'Workflow Action Triggered',
  description: 'Triggers when a workflow action is triggered in SavvyCal.',
  props: {},
  sampleData: {
    event_type: 'workflow.action.triggered',
    id: 'wf_abc123',
    action: 'send_email',
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const response = await savvyCalApiCall<{ id: string; secret: string }>({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/webhooks',
      body: { url: context.webhookUrl },
    });
    await context.store.put('webhookId', response.body.id);
    await context.store.put('webhookSecret', response.body.secret);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>('webhookId');
    if (webhookId) {
      await savvyCalApiCall({
        token: context.auth.secret_text,
        method: HttpMethod.DELETE,
        path: `/webhooks/${webhookId}`,
      });
    }
  },

  async run(context) {
    const secret = await context.store.get<string>('webhookSecret');
    const signature = context.payload.headers['x-savvycal-signature'] as string | undefined;
    if (secret && (!signature || !verifyWebhookSignature(secret, signature, context.payload.rawBody))) {
      return [];
    }

    const body = context.payload.body as { type: string; payload: Record<string, unknown> };
    if (!body?.payload || body.type !== 'workflow.action.triggered') return [];

    return [{ event_type: body.type, ...body.payload }];
  },

  async test(_context) {
    return [];
  },
});
