
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown } from '../common/props';
import { makeRequest } from '../common/client';

export const languageRemoved = createTrigger({
  auth: lokaliseAuth,
  name: 'languageRemoved',
  displayName: 'Language Removed',
  description: 'Trigger when a language is removed from your Lokalise project',
  props: {
    projectId: projectDropdown,
  },
  sampleData: {
    event: 'project.language.removed',
    timestamp: '2023-01-01T12:00:00Z',
    project_id: '3002780358964f9bab5a92.87762498',
    language: {
      language_id: 640,
      language_iso: 'fr',
      language_name: 'French',
      plural_forms: ['one', 'other'],
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const projectId = context.propsValue.projectId;

    const body = {
      url: context.webhookUrl,
      events: ['project.language.removed'],
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