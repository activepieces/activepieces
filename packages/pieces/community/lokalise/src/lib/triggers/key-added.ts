import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown } from '../common/props';
import { makeRequest } from '../common/client';

export const keyAdded = createTrigger({
  auth: lokaliseAuth,
  name: 'keyAdded',
  displayName: 'Key Added',
  description: 'Trigger when a new key is added to your Lokalise project',
  props: {
    projectId: projectDropdown,
  },
  sampleData: {
    event: 'project.key.added',
    timestamp: '2023-01-01T12:00:00Z',
    project_id: '3002780358964f9bab5a92.87762498',
    key: {
      key_id: 331223,
      key_name: {
        ios: 'index.welcome',
        android: 'index.welcome',
        web: 'index.welcome',
        other: 'index.welcome',
      },
      description: 'Index app welcome',
      platforms: ['web'],
      tags: ['ui', 'home'],
      created_at: '2023-01-01T12:00:00Z',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const projectId = context.propsValue.projectId;

    const body = {
      url: context.webhookUrl,
      events: ['project.key.added'],
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
