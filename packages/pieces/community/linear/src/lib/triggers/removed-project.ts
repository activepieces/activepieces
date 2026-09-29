import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { makeClient } from '../common/client';
import { linearWebhook } from '../common/webhook';
import { projectWebhookOutputSchema } from '../output-schemas';
import { linearWebhookSamples } from '../common/webhook-samples';

export const linearRemovedProject = createTrigger({
  auth: linearAuth,
  name: 'removed_project',
  classification: 'READ',
  displayName: 'Removed Project',
  description: 'Triggers when an existing Linear project is removed. Only projects in public teams are covered.',
  aiMetadata: {
    description: 'Fires when an existing project is deleted anywhere in the Linear workspace. Represents the project as it was at the time of removal. Only public teams are covered: events in private teams do not fire it.',
  },
  props: {},
  sampleData: linearWebhookSamples.removedProjectSample,
  outputSchema: projectWebhookOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await linearWebhook.register({
      auth: context.auth,
      store: context.store,
      storeKey: '_removed_project_trigger',
      input: {
        label: 'ActivePieces Removed Project',
        url: context.webhookUrl,
        resourceTypes: ['Project'],
        allPublicTeams: true,
      },
    });
  },
  async onDisable(context) {
    const client = makeClient(context.auth);
    const response = await context.store?.get<WebhookInformation>(
      '_removed_project_trigger'
    );
    if (response && response.webhookId) {
      await client.deleteWebhook(response.webhookId);
    }
  },
  async run(context) {
    const body = context.payload.body as { action: string; data: unknown };
    if (body.action === 'remove') {
      return [body];
    }
    return [];
  },
});

interface WebhookInformation {
  webhookId: string;
}
