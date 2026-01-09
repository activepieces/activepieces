import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { lokaliseAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';
import { projectDropdown } from '../common/props';
export const keyUpdated = createTrigger({
  auth: lokaliseAuth,
  name: 'keyUpdated',
  displayName: 'Key Updated',
  description: 'Trigger when a key is updated in your Lokalise project',
  props: { projectId: projectDropdown },
  sampleData: {
    event: 'project.key.modified',
    key: {
      id: 782130622,
      name: 'test update key',
      previous_name: 'welcome_header',
      filenames: { ios: null, android: null, web: null, other: null },
      tags: [],
      hidden: false,
      screenshots: [],
    },
    project: { id: '30473913695e05bacfe965.32690341', name: 'test' },
    user: {
      full_name: 'jon ',
      email: 'jon@example.com',
    },
    created_at: '2026-01-09 07:43:32',
    created_at_timestamp: 1767941012,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const projectId = context.propsValue.projectId;

    const body = {
      url: context.webhookUrl,
      events: ['project.key.modified'],
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
