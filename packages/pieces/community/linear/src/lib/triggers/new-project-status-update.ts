import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { makeClient } from '../common/client';
import { props } from '../common/props';
import { linearWebhook } from '../common/webhook';
import { projectStatusUpdateWebhookOutputSchema } from '../output-schemas';
import { linearWebhookSamples } from '../common/webhook-samples';
import { LINEAR_SIGNATURE_HEADER, linearWebhookSignature } from '../common/webhook-signature';

export const linearNewProjectStatusUpdate = createTrigger({
  auth: linearAuth,
  name: 'new_project_status_update',
  classification: 'READ',
  displayName: 'New Project Status Update',
  description: 'Triggers when a status update is posted on a project. Only projects in public teams are covered.',
  aiMetadata: {
    description:
      'Fires once each time someone posts a status update (body plus on track / at risk / off track health) on a Linear project, optionally only for one project. Does not fire when the project itself is edited. Only public teams are covered: updates on projects of private teams do not fire it.',
  },
  props: {
    project_id: props.any_project_id(false),
  },
  sampleData: linearWebhookSamples.newProjectStatusUpdateSample,
  outputSchema: projectStatusUpdateWebhookOutputSchema,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await linearWebhook.register({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      input: {
        label: 'ActivePieces New Project Status Update',
        url: context.webhookUrl,
        resourceTypes: ['ProjectUpdate'],
        allPublicTeams: true,
        secret: linearWebhookSignature.newSecret(),
      },
    });
  },
  async onDisable(context) {
    const stored = await context.store.get<StoredWebhook>(STORE_KEY);
    if (stored?.webhookId) {
      await makeClient(context.auth).deleteWebhook(stored.webhookId);
      await context.store.delete(STORE_KEY);
    }
  },
  async run(context) {
    const stored = await context.store.get<StoredWebhook>(STORE_KEY);
    const verified = linearWebhookSignature.verify({
      secret: stored?.secret,
      signatureHeader: linearWebhookSignature.headerOf({
        headers: context.payload.headers,
        name: LINEAR_SIGNATURE_HEADER,
      }),
      rawBody: context.payload.rawBody,
    });
    if (!verified) {
      return [];
    }
    const body = context.payload.body;
    if (!isProjectUpdatePayload(body) || body.action !== 'create') {
      return [];
    }
    const projectId = context.propsValue.project_id;
    if (projectId && (body.data.projectId ?? body.data.project?.id) !== projectId) {
      return [];
    }
    return [body];
  },
});

function isProjectUpdatePayload(value: unknown): value is ProjectUpdatePayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    'action' in value &&
    'data' in value &&
    typeof value.data === 'object' &&
    value.data !== null
  );
}

const STORE_KEY = '_new_project_status_update_trigger';

type StoredWebhook = {
  webhookId: string;
  secret?: string;
};

type ProjectUpdatePayload = {
  action: string;
  data: {
    projectId?: string;
    project?: { id?: string };
  };
};
