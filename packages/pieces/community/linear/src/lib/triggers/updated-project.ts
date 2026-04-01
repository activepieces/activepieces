import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { makeClient } from '../common/client';

export const linearUpdatedProject = createTrigger({
  auth: linearAuth,
  name: 'updated_project',
  displayName: 'Updated Project',
  description: 'Triggers when an existing Linear project is updated',
  props: {},
  sampleData: {
    action: 'update',
    data: {
      id: 'project_1',
      name: 'Test project updated',
      description: 'This is a test project (updated)',
      state: 'started',
      color: '#000000',
      icon: null,
      startDate: '2023-09-05',
      targetDate: '2023-12-05',
      creator: {
        id: 'user_1',
        name: 'Test user',
        email: 'test@gmail.com',
      },
      teams: [
        {
          id: 'team_1',
          name: 'Test team',
          key: 'test-team',
        },
      ],
      createdAt: '2023-09-05T12:00:00.000Z',
      updatedAt: '2023-09-06T12:00:00.000Z',
    },
    updatedFrom: {
      updatedAt: '2023-09-06T12:00:00.000Z',
      state: 'planned',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const client = makeClient(context.auth);
    const webhook = await client.createWebhook({
      label: 'ActivePieces Updated Project',
      url: context.webhookUrl,
      resourceTypes: ['Project'],
      allPublicTeams: true,
    });
    if (webhook.success && webhook.webhook) {
      await context.store?.put<WebhookInformation>(
        '_updated_project_trigger',
        {
          webhookId: (await webhook.webhook).id,
        }
      );
    } else {
      console.error('Failed to create the webhook');
    }
  },
  async onDisable(context) {
    const client = makeClient(context.auth);
    const response = await context.store?.get<WebhookInformation>(
      '_updated_project_trigger'
    );
    if (response && response.webhookId) {
      await client.deleteWebhook(response.webhookId);
    }
  },
  async run(context) {
    const body = context.payload.body as { action: string; data: unknown };
    if (body.action === 'update') {
      return [body.data];
    }
    return [];
  },
});

interface WebhookInformation {
  webhookId: string;
}
