
import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { lokaliseAuth } from '../common/auth';
import { projectDropdown } from '../common/props';
import { makeRequest } from '../common/client';

export const projectExported = createTrigger({
  auth: lokaliseAuth,
  name: 'projectExported',
  displayName: 'Project Exported',
  description: 'Trigger when files are exported from your Lokalise project',
  props: {
    projectId: projectDropdown,
  },
  sampleData: {
    event: 'project.exported',
    timestamp: '2023-01-01T12:00:00Z',
    project_id: '3002780358964f9bab5a92.87762498',
    export_info: {
      bundle_url: 'https://s3-eu-west-1.amazonaws.com/lokalise-assets/export/MyApp-locale.zip',
      exported_by: 420,
      exported_at: '2023-01-01T12:00:00Z',
      format: 'json',
      languages_count: 5,
      files_count: 10,
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const projectId = context.propsValue.projectId;

    const body = {
      url: context.webhookUrl,
      events: ['project.exported'],
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