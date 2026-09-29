import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { makeClient } from '../common/client';
import { linearWebhook } from '../common/webhook';
import { projectWebhookOutputSchema } from '../output-schemas';
import { linearWebhookSamples } from '../common/webhook-samples';

export const linearNewProject = createTrigger({
  auth: linearAuth,
  name: 'new_project',
  classification: 'READ',
  displayName: 'New Project',
  description: 'Triggers when a new project is created in Linear. Only projects in public teams are covered.',
  aiMetadata: {
    description: 'Fires when a new project is created anywhere in the Linear workspace. Represents the newly created project with its details such as name, state, dates, and teams. Only public teams are covered: events in private teams do not fire it.',
  },
  props: {},
  sampleData: linearWebhookSamples.newProjectSample,
  outputSchema: projectWebhookOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await linearWebhook.register({
      auth: context.auth,
      store: context.store,
      storeKey: '_new_project_trigger',
      input: {
        label: 'ActivePieces New Project',
        url: context.webhookUrl,
        resourceTypes: ['Project'],
        allPublicTeams: true,
      },
    });
  },
  async onDisable(context) {
    const client = makeClient(context.auth);
    const response = await context.store?.get<WebhookInformation>(
      '_new_project_trigger'
    );
    if (response && response.webhookId) {
      await client.deleteWebhook(response.webhookId);
    }
  },
  async run(context) {
    const body = context.payload.body as { action: string; data: unknown };
    if (body.action === 'create') {
      return [body];
    }
    return [];
  },
});

interface WebhookInformation {
  webhookId: string;
}
