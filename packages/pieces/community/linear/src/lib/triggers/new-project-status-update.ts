import { createTrigger, Store, TriggerStrategy } from '@activepieces/pieces-framework';
import { linearAuth } from '../..';
import { makeClient } from '../common/client';
import { LinearAuth, linearGraphql } from '../common/graphql';
import { props } from '../common/props';
import { linearWebhook } from '../common/webhook';
import { projectStatusUpdateWebhookOutputSchema } from '../output-schemas';
import { linearWebhookSamples } from '../common/webhook-samples';
import { LINEAR_DELIVERY_HEADER, LINEAR_SIGNATURE_HEADER, linearWebhookSignature } from '../common/webhook-signature';

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
      await deleteWebhookIfPresent({ auth: context.auth, webhookId: stored.webhookId });
      await context.store.delete(STORE_KEY);
    }
    await context.store.delete(DELIVERIES_STORE_KEY);
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
    if (!isProjectUpdatePayload(body) || !linearWebhookSignature.isFreshTimestamp({ timestamp: body.webhookTimestamp, now: Date.now() })) {
      return [];
    }
    const deliveryId = linearWebhookSignature.headerOf({ headers: context.payload.headers, name: LINEAR_DELIVERY_HEADER });
    if (deliveryId && !(await rememberDelivery({ store: context.store, deliveryId }))) {
      return [];
    }
    if (body.action !== 'create') {
      return [];
    }
    const projectId = context.propsValue.project_id;
    if (projectId && (body.data.projectId ?? body.data.project?.id) !== projectId) {
      return [];
    }
    return [body];
  },
});

async function deleteWebhookIfPresent({ auth, webhookId }: { auth: LinearAuth; webhookId: string }): Promise<void> {
  try {
    await makeClient(auth).deleteWebhook(webhookId);
  } catch (error) {
    if (!linearGraphql.isNotFoundError(error)) {
      throw error;
    }
  }
}

async function rememberDelivery({ store, deliveryId }: { store: Store; deliveryId: string }): Promise<boolean> {
  const seen = (await store.get<string[]>(DELIVERIES_STORE_KEY)) ?? [];
  if (seen.includes(deliveryId)) {
    return false;
  }
  await store.put<string[]>(DELIVERIES_STORE_KEY, [...seen, deliveryId].slice(-MAX_REMEMBERED_DELIVERIES));
  return true;
}

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
const DELIVERIES_STORE_KEY = '_new_project_status_update_deliveries';
const MAX_REMEMBERED_DELIVERIES = 200;

type StoredWebhook = {
  webhookId: string;
  secret?: string;
};

type ProjectUpdatePayload = {
  action: string;
  webhookTimestamp?: number;
  data: {
    projectId?: string;
    project?: { id?: string };
  };
};
