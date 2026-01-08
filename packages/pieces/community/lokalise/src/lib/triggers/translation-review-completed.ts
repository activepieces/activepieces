import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown } from '../common/props';
import { makeRequest } from '../common/client';

const BASE_URL = 'https://api.lokalise.com/api2';

export const translationReviewCompleted = createTrigger({
  auth: lokaliseAuth,
  name: 'translationReviewCompleted',
  displayName: 'Translation Review Completed',
  description:
    'Trigger when a translation review is completed in your Lokalise project',
  props: {
    projectId: projectDropdown,
  },
  sampleData: {
    event: 'project.translation.proofread',
    timestamp: '2023-01-01T12:00:00Z',
    project_id: '3002780358964f9bab5a92.87762498',
    translation: {
      translation_id: 344412,
      key_id: 553662,
      language_iso: 'en_US',
      translation: 'Hello, world!',
      is_reviewed: true,
      reviewed_by: 420,
      modified_at: '2023-01-01T12:00:00Z',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const projectId = context.propsValue.projectId;

    const body = {
      url: context.webhookUrl,
      events: ['project.translation.proofread'],
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
