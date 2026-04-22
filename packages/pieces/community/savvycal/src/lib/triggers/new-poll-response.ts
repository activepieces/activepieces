import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, verifyWebhookSignature } from '../common';
import { savvyCalAuth } from '../../';

const POLL_RESPONSE_TYPES = [
  { label: 'Poll Response Created', value: 'poll.response.created' },
  { label: 'Poll Response Updated', value: 'poll.response.updated' },
];

const SAMPLE_DATA = {
  event_type: 'poll.response.created',
  id: 'pr_abc123',
  respondent_email: 'jane@example.com',
};

export const newPollResponseTrigger = createTrigger({
  auth: savvyCalAuth,
  name: 'new_poll_response',
  displayName: 'New Poll Response',
  description: 'Triggers when a poll response is created or updated in SavvyCal.',
  props: {
    event_types: Property.StaticMultiSelectDropdown({
      displayName: 'Poll Response Types',
      description: 'Select which poll response types to trigger on. Leave empty to trigger on all poll response types.',
      required: false,
      options: { options: POLL_RESPONSE_TYPES },
    }),
  },
  sampleData: SAMPLE_DATA,
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
    if (!body?.payload) return [];

    if (!POLL_RESPONSE_TYPES.some((t) => t.value === body.type)) return [];

    const selectedTypes = context.propsValue.event_types as string[] | undefined;
    if (selectedTypes && selectedTypes.length > 0 && !selectedTypes.includes(body.type)) return [];

    return [{ event_type: body.type, ...body.payload }];
  },

  async test(_context) {
    return [SAMPLE_DATA];
  },
});
