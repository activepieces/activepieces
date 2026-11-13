import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { linearWebhook } from '../common/webhook';
import { issueWebhookOutputSchema } from '../output-schemas';
import { linearWebhookSamples } from '../common/webhook-samples';
import { props } from '../common/props';

export const linearNewIssue = createTrigger({
  auth: linearAuth,
  name: 'new_issue',
  classification: 'READ',
  displayName: 'New Issue',
  description: 'Triggers when an issue is created in the selected team.',
  aiMetadata: {
    description: 'Fires when a new issue is created in the selected Linear team. Represents the newly created issue with its details such as title, assignee, state, and labels.',
  },
  props: {
    team_id: props.team_id(true, 'The team to watch, public or private.'),
  },
  sampleData: linearWebhookSamples.newIssueSample,
  outputSchema: issueWebhookOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await linearWebhook.register({
      auth: context.auth,
      store: context.store,
      storeKey: '_new_issue_trigger',
      input: {
        label: 'ActivePieces New Issue',
        url: context.webhookUrl,
        teamId: context.propsValue['team_id'],
        resourceTypes: ['Issue'],
      },
    });
  },
  async onDisable(context) {
    await linearWebhook.unregister({
      auth: context.auth,
      store: context.store,
      storeKey: '_new_issue_trigger',
    });
  },
  async run(context) {
    const body = context.payload.body as { action: string; data: unknown };
    if (body.action === 'create') {
      return [body];
    }
    return [];
  },
});
