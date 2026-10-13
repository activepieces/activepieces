import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { linearWebhook } from '../common/webhook';
import { updatedIssueWebhookOutputSchema } from '../output-schemas';
import { linearWebhookSamples } from '../common/webhook-samples';
import { props } from '../common/props';

export const linearUpdatedIssue = createTrigger({
  auth: linearAuth,
  name: 'updated_issue',
  classification: 'READ',
  displayName: 'Updated Issue',
  description: 'Triggers when an issue changes. Pick a team to include a private one.',
  aiMetadata: {
    description:
      'Fires when an existing Linear issue is modified, optionally scoped to a specific team. Represents the updated issue along with the fields that changed. Without a team selected only public teams are covered; pick the team to include a private one.',
  },
  props: {
    team_id: props.team_id(false, 'The team to watch. Empty: every public team.'),
    changed_fields: Property.StaticMultiSelectDropdown({
      displayName: 'Changed Fields',
      description: 'Fire only when one of these changes. Empty: any change.',
      required: false,
      options: {
        options: [
          { label: 'Status', value: 'stateId' },
          { label: 'Team', value: 'teamId' },
          { label: 'Assignee', value: 'assigneeId' },
          { label: 'Priority', value: 'priority' },
          { label: 'Title', value: 'title' },
          { label: 'Description', value: 'description' },
          { label: 'Labels', value: 'labelIds' },
          { label: 'Estimate', value: 'estimate' },
          { label: 'Due Date', value: 'dueDate' },
          { label: 'Project', value: 'projectId' },
          { label: 'Cycle', value: 'cycleId' },
          { label: 'Parent Issue', value: 'parentId' },
        ],
      },
    }),
  },
  sampleData: linearWebhookSamples.updatedIssueSample,
  outputSchema: updatedIssueWebhookOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const teamId = context.propsValue['team_id'];
    await linearWebhook.register({
      auth: context.auth,
      store: context.store,
      storeKey: '_updated_issue_trigger',
      input: {
        label: 'ActivePieces Updated Issue',
        url: context.webhookUrl,
        resourceTypes: ['Issue'],
        ...(teamId ? { teamId } : { allPublicTeams: true }),
      },
    });
  },
  async onDisable(context) {
    await linearWebhook.unregister({
      auth: context.auth,
      store: context.store,
      storeKey: '_updated_issue_trigger',
    });
  },
  async run(context) {
    const body = context.payload.body as {
      action: string;
      data: unknown;
      updatedFrom?: Record<string, unknown>;
    };
    if (body.action !== 'update') {
      return [];
    }
    const selected = context.propsValue.changed_fields ?? [];
    if (selected.length > 0) {
      const changed = Object.keys(body.updatedFrom ?? {});
      if (!selected.some((field) => changed.includes(field))) {
        return [];
      }
    }
    return [body];
  },
});
