import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { makeClient } from '../common/client';
import { props } from '../common/props';

export const linearUpdatedProject = createTrigger({
  auth: linearAuth,
  name: 'updated_project',
  displayName: 'Project Status Updated',
  description: 'Triggers when the status of an Linear project is updated',
  props: {
    team_ids: props.team_ids(false),
    project_status: props.project_statuses(false),
  },
  sampleData: {
    action: 'update',
    data: {
      id: 'project_1',
      name: 'Test project updated',
      description: 'This is a test project (updated)',
      state: 'started',
      statusName: 'In Progress',
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
    const body = context.payload.body as ProjectUpdatePayload;

    if (body.action !== 'update') return [];
    // Only fire when the project status actually changed
    if (!body.updatedFrom?.statusId) return [];
    
    const selectedTeamIds = context.propsValue.team_ids ?? [];
    const selectedStatus = context.propsValue.project_status;

    if (selectedTeamIds.length > 0) {
      const projectTeamIds = body.data.teamIds ?? [];
      if (!selectedTeamIds.some((id) => projectTeamIds.includes(id))) {
        return [];
      }
    }

    if (selectedStatus && selectedStatus !== body.data.status?.name) {
      return [];
    }

    return [body.data];
  },
});

interface WebhookInformation {
  webhookId: string;
}

interface ProjectUpdatePayload {
  action: string;
  data: {
    teamIds?: string[];
    status?: { id: string; name: string; type: string; color: string };
    [key: string]: unknown;
  };
  updatedFrom: {
    statusId?: string;
    [key: string]: unknown;
  };
}
