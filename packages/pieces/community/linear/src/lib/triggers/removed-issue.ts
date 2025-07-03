import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { makeClient } from '../common/client';
import { props } from '../common/props';

export const linearRemovedIssue = createTrigger({
  auth: linearAuth,
  name: 'removed_issue',
  displayName: 'Removed Issue',
  description: 'Triggers when an existing Linear issue is removed',
  props: {
    team_id: props.team_id()
  },
  sampleData: {
    // Sample data structure based on Linear's webhook payload for issues
    action: 'remove',
    data: {
      id: 'issue_1',
      identifier: '1',
      title: 'Test issue',
      description: 'This is a test issue',
      priority: 'priority_1',
      priorityLabel: 'High',
      state: 'state_1',
      stateLabel: 'In Progress',
      team: {
        id: 'team_1',
        name: 'Test team',
        key: 'test-team',
        description: 'This is a test team',
        archived: false,
        createdAt: '2023-09-05T12:00:00.000Z',
        updatedAt: '2023-09-05T12:00:00.000Z',
      },
      creator: {
        id: 'user_1',
        name: 'Test user',
        email: 'test@gmail.com',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
        createdAt: '2023-09-05T12:00:00.000Z',
        updatedAt: '2023-09-05T12:00:00.000Z',
      },
      assignee: {
        id: 'user_1',
        name: 'Test user',
        email: 'test@gmail.com',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
        createdAt: '2023-09-05T12:00:00.000Z',
        updatedAt: '2023-09-05T12:00:00.000Z',
      },
      labels: [
        {
          id: 'label_1',
          name: 'Test label',
          color: '#000000',
          createdAt: '2023-09-05T12:00:00.000Z',
          updatedAt: '2023-09-05T12:00:00.000Z',
        },
      ],
      createdAt: '2023-09-05T12:00:00.000Z',
      updatedAt: '2023-09-05T12:00:00.000Z',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const client = makeClient(context.auth as string);
    const webhook = await client.createWebhook({
      label: 'ActivePieces Updated Issue',
      url: context.webhookUrl,
      teamId: context.propsValue['team_id'],
      resourceTypes: ['Issue']
    });
    if (webhook.success && webhook.webhook) {
      await context.store?.put<WebhookInformation>('_removed_issue_trigger', {
        webhookId: (await webhook.webhook).id
      });
    } else {
      console.error('Failed to create the webhook');
    }
  },
  async onDisable(context) {
    const client = makeClient(context.auth as string);
    const response = await context.store?.get<WebhookInformation>(
      '_removed_issue_trigger'
    );
    if (response && response.webhookId) {
      await client.deleteWebhook(response.webhookId);
    }
  },
  async run(context) {
    const body = context.payload.body as { action: string; data: unknown};
    if (body.action === 'remove') {
      return [body.data];
    }
    return [];
  }
});

interface WebhookInformation {
  webhookId: string;
}
