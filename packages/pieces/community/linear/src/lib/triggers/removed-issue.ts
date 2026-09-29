import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { linearWebhook } from '../common/webhook';
import { issueWebhookOutputSchema } from '../output-schemas';
import { linearWebhookSamples } from '../common/webhook-samples';
import { props } from '../common/props';

export const linearRemovedIssue = createTrigger({
  auth: linearAuth,
  name: 'removed_issue',
  classification: 'READ',
  displayName: 'Removed Issue',
  description: 'Triggers when an existing Linear issue is removed',
  aiMetadata: {
    description: 'Fires when an existing issue is deleted from the selected Linear team. Represents the issue as it was at the time of removal.',
  },
  props: {
    team_id: props.team_id()
  },
  sampleData: linearWebhookSamples.removedIssueSample,
  outputSchema: issueWebhookOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await linearWebhook.register({
      auth: context.auth,
      store: context.store,
      storeKey: '_removed_issue_trigger',
      input: {
        label: 'ActivePieces Removed Issue',
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
      storeKey: '_removed_issue_trigger',
    });
  },
  async run(context) {
    const body = context.payload.body as { action: string; data: unknown};
    if (body.action === 'remove') {
      return [body];
    }
    return [];
  }
});
