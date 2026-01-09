import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown } from '../common/props';
import { makeRequest } from '../common/client';

export const keyDeleted = createTrigger({
  auth: lokaliseAuth,
  name: 'keyDeleted',
  displayName: 'Key Deleted',
  description: 'Trigger when a key is deleted from your Lokalise project',
  props: {
    projectId: projectDropdown,
  },
  sampleData: {
    event: 'project.keys.deleted',
    action: '',
    keys: [
      {
        id: 782130622,
        name: 'test update key',
        base_value: 'Hello world!',
        filenames: { ios: null, android: null, web: null, other: null },
      },
    ],
    project: { id: '30473913695e05bascfe965.32690341', name: 'test' },
    user: {
      full_name: 'jon',
      email: 'jon@example.com',
    },
    created_at: '2026-01-09 07:46:03',
    created_at_timestamp: 1767941163,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const projectId = context.propsValue.projectId;

    const body = {
      url: context.webhookUrl,
      events: ['project.keys.deleted'],
    };

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/projects/${projectId}/webhooks`,
      body
    );

    const webhookId = (response.body as any).webhook.webhook_id;
    await context.store?.put('webhook_id', webhookId);
  },
  async onDisable(context) {
    const projectId = context.propsValue.projectId;
    const webhookId = await context.store?.get('webhook_id');

    if (webhookId) {
      try {
        await makeRequest(
          context.auth.secret_text,
          HttpMethod.DELETE,
          `/projects/${projectId}/webhooks/${webhookId}`
        );
      } catch (error) {
        console.error('Error deleting webhook:', error);
      }
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
