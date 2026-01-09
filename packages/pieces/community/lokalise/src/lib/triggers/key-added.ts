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
    key: {
      id: 783570856,
      name: 'index.welcome',
      base_value: null,
      filenames: {
        ios: null,
        android: null,
        web: null,
        other: null,
      },
      tags: [],
    },
    project: {
      id: 'aasasasasas',
      name: 'test',
    },
    user: {
      full_name: 'fadse',
      email: 'sasdf@gmail.com',
    },
    created_at: '2026-01-09 07:38:20',
    created_at_timestamp: 1767940700,
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const projectId = context.propsValue.projectId;

    const body = {
      url: context.webhookUrl,
      events: ['project.key.added'],
    };
    console.log('Creating webhook with body:', body, projectId);
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
