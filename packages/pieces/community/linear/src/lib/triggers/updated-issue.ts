import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { makeClient } from '../common/client';
import { props } from '../common/props';

export const linearUpdatedIssue = createTrigger({
  auth: linearAuth,
  name: 'updated_issue',
  displayName: 'Updated Issue',
  description: 'Triggers when an existing Linear issue is updated',
  props: {
    team_id: props.team_id(false)
  },
  sampleData: {
    // Sample data structure based on Linear's webhook payload for issues
    action: 'update',
    data: {
      id: 'issue_1',
      identifier: '1',
      title: 'Test issue updated',
      description: 'This is a test issue (updated)',
      priority: 'priority_1',
      priorityLabel: 'High',
      state: 'state_2',
      stateLabel: 'In Review',
      team: {
        id: 'team_2',
        name: 'Test team',
        key: 'test-team',
        description: 'This is another test team',
        archived: false,
        createdAt: '2023-09-05T12:00:00.000Z',
        updatedAt: '2023-09-06T12:00:00.000Z'
      },
      creator: {
        id: 'user_1',
        name: 'Test user',
        email: 'test@gmail.com',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
        createdAt: '2023-09-05T12:00:00.000Z',
        updatedAt: '2023-09-06T12:00:00.000Z'
      },
      assignee: {
        id: 'user_1',
        name: 'Test user',
        email: 'test@gmail.com',
        avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
        createdAt: '2023-09-05T12:00:00.000Z',
        updatedAt: '2023-09-05T12:00:00.000Z'
      },
      labels: [
        {
          id: 'label_1',
          name: 'Test label',
          color: '#000000',
          createdAt: '2023-09-05T12:00:00.000Z',
          updatedAt: '2023-09-05T12:00:00.000Z'
        },
        {
          id: 'label_1',
          name: 'Test label 2',
          color: '#000000',
          createdAt: '2023-09-05T12:00:00.000Z',
          updatedAt: '2023-09-06T12:00:00.000Z'
        }
      ],
      createdAt: '2023-09-05T12:00:00.000Z',
      updatedAt: '2023-09-06T12:00:00.000Z'
    },
    updatedFrom: {
      'updatedAt': '2023-09-06T12:00:00.000Z',
      'sortOrder': -14.61,
      'startedAt': null,
      'stateId': 'state_1'
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const client = makeClient(context.auth as string);
    
    // Create webhook configuration
    const webhookConfig: any = {
      label: 'ActivePieces Updated Issue',
      url: context.webhookUrl,
      allPublicTeams: true,
      resourceTypes: ['Issue']
    };
    
    // Only add teamId if it's provided
    if (context.propsValue['team_id']) {
      webhookConfig.teamId = context.propsValue['team_id'];
    }
    
    const webhook = await client.createWebhook(webhookConfig);
    
    if (webhook.success && webhook.webhook) {
      await context.store?.put<WebhookInformation>('_updated_issue_trigger', {
        webhookId: (await webhook.webhook).id
      });
    } else {
      console.error('Failed to create the webhook');
    }
  },
  async onDisable(context) {
    const client = makeClient(context.auth as string);
    const response = await context.store?.get<WebhookInformation>(
      '_updated_issue_trigger'
    );
    if (response && response.webhookId) {
      await client.deleteWebhook(response.webhookId);
    }
  },
  async run(context) {
    const body = context.payload.body as { action: string; data: unknown};
    if (body.action === 'update') {
      return [body.data];
    }
    return [];
  }
});

interface WebhookInformation {
  webhookId: string;
}
