import { TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import type { InputPropertyMap } from '@activepieces/pieces-framework';
import { opplifyAuth } from './auth';
import { opplifyClient } from './client';

const BASE_URL = process.env['AP_OPPLIFY_BASE_URL'] || 'http://host.docker.internal:3001';

interface OpplifyTriggerConfig {
  name: string;
  displayName: string;
  description: string;
  eventType: string;
  props?: InputPropertyMap;
  sampleData: unknown;
}

function buildFilters(propsValue: Record<string, unknown>): Record<string, unknown> {
  const filters: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(propsValue)) {
    if (key === 'auth' || key === 'markdown') continue;
    if (value !== undefined && value !== null && value !== '') {
      filters[key] = value;
    }
  }
  return filters;
}

async function getClientContext(context: { project: { id: string; externalId: () => Promise<string | undefined> } }) {
  const externalId = await context.project.externalId() || '';
  return {
    projectId: context.project.id,
    externalId,
    baseUrl: BASE_URL,
  };
}

export function createOpplifyTrigger(config: OpplifyTriggerConfig) {
  return createTrigger({
    auth: opplifyAuth,
    name: config.name,
    displayName: config.displayName,
    description: config.description,
    type: TriggerStrategy.WEBHOOK,
    props: config.props ?? {},

    async onEnable(context) {
      const ctx = await getClientContext(context);
      const client = opplifyClient(ctx);
      const subscriptionId = await client.subscribe({
        eventType: config.eventType,
        webhookUrl: context.webhookUrl,
        flowId: context.flows.current.id,
        triggerName: config.name,
        filters: buildFilters(context.propsValue as Record<string, unknown>),
      });
      await context.store.put('subscriptionId', subscriptionId);
    },

    async onDisable(context) {
      const subscriptionId = await context.store.get<string>('subscriptionId');
      if (subscriptionId) {
        const ctx = await getClientContext(context);
        const client = opplifyClient(ctx);
        await client.unsubscribe({ subscriptionId });
      }
    },

    async run(context) {
      return [context.payload.body];
    },

    async test(context) {
      const ctx = await getClientContext(context);
      const client = opplifyClient(ctx);
      const testData = await client.testTrigger({
        eventType: config.eventType,
        filters: buildFilters(context.propsValue as Record<string, unknown>),
      });
      return [testData];
    },

    sampleData: config.sampleData,
  });
}
