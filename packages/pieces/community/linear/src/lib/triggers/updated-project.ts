import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { linearWebhook } from '../common/webhook';
import { updatedProjectWebhookOutputSchema } from '../output-schemas';
import { linearWebhookSamples } from '../common/webhook-samples';
import { props } from '../common/props';

export const linearUpdatedProject = createTrigger({
  auth: linearAuth,
  name: 'updated_project',
  classification: 'READ',
  displayName: 'Project Status Updated',
  description: 'Triggers when the status of an Linear project is updated. Only projects in public teams are covered.',
  aiMetadata: {
    description: 'Fires when a Linear project status changes, optionally filtered to specific teams or a target status. Represents the project after the status change. Only public teams are covered: events in private teams do not fire it.',
  },
  props: {
    team_ids: props.team_ids(false),
    project_status: props.project_statuses(false),
  },
  sampleData: linearWebhookSamples.updatedProjectSample,
  outputSchema: updatedProjectWebhookOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await linearWebhook.register({
      auth: context.auth,
      store: context.store,
      storeKey: '_updated_project_trigger',
      input: {
        label: 'ActivePieces Updated Project',
        url: context.webhookUrl,
        resourceTypes: ['Project'],
        allPublicTeams: true,
      },
    });
  },
  async onDisable(context) {
    await linearWebhook.unregister({
      auth: context.auth,
      store: context.store,
      storeKey: '_updated_project_trigger',
    });
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

    return [body];
  },
});


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
