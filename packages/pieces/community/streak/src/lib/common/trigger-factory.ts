import {
  createTrigger,
  OutputSchema,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { streakAuth } from './auth';
import { pipelineDropdown, teamDropdown } from './props';
import {
  createPipelineWebhook,
  createTeamWebhook,
  deleteWebhook,
} from './webhooks';

type StoredWebhook = { webhookKey?: string };

export function createPipelineWebhookTrigger({
  name,
  displayName,
  description,
  aiMetadata,
  event,
  sampleData,
  outputSchema,
}: {
  name: string;
  displayName: string;
  description: string;
  aiMetadata?: { description: string };
  event: string;
  sampleData: Record<string, unknown>;
  outputSchema: OutputSchema;
}) {
  return createTrigger({
    auth: streakAuth,
    name,
    classification: 'READ',
    displayName,
    description,
    aiMetadata,
    type: TriggerStrategy.WEBHOOK,
    props: {
      pipelineKey: pipelineDropdown,
    },
    sampleData,
    outputSchema,
    async onEnable(context) {
      const webhook = await createPipelineWebhook({
        apiKey: context.auth.secret_text,
        pipelineKey: context.propsValue.pipelineKey,
        event,
        targetUrl: context.webhookUrl,
      });
      await context.store.put<StoredWebhook>(STORE_KEY, { webhookKey: webhook.key });
    },
    async onDisable(context) {
      const stored = await context.store.get<StoredWebhook>(STORE_KEY);
      if (stored?.webhookKey) {
        await deleteWebhook({
          apiKey: context.auth.secret_text,
          webhookKey: stored.webhookKey,
        });
      }
    },
    async run(context) {
      return payloadToItems(context.payload.body);
    },
  });
}

export function createTeamWebhookTrigger({
  name,
  displayName,
  description,
  aiMetadata,
  event,
  sampleData,
  outputSchema,
}: {
  name: string;
  displayName: string;
  description: string;
  aiMetadata?: { description: string };
  event: string;
  sampleData: Record<string, unknown>;
  outputSchema: OutputSchema;
}) {
  return createTrigger({
    auth: streakAuth,
    name,
    classification: 'READ',
    displayName,
    description,
    aiMetadata,
    type: TriggerStrategy.WEBHOOK,
    props: {
      teamKey: teamDropdown,
    },
    sampleData,
    outputSchema,
    async onEnable(context) {
      const webhook = await createTeamWebhook({
        apiKey: context.auth.secret_text,
        teamKey: context.propsValue.teamKey,
        event,
        targetUrl: context.webhookUrl,
      });
      await context.store.put<StoredWebhook>(STORE_KEY, { webhookKey: webhook.key });
    },
    async onDisable(context) {
      const stored = await context.store.get<StoredWebhook>(STORE_KEY);
      if (stored?.webhookKey) {
        await deleteWebhook({
          apiKey: context.auth.secret_text,
          webhookKey: stored.webhookKey,
        });
      }
    },
    async run(context) {
      return payloadToItems(context.payload.body);
    },
  });
}

function payloadToItems(body: unknown): Record<string, unknown>[] {
  const parsed = typeof body === 'string' ? parseJson(body) : body;
  if (isRecord(parsed)) {
    return [parsed];
  }
  if (Array.isArray(parsed)) {
    return parsed.filter(isRecord);
  }
  return [];
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const STORE_KEY = 'streak_webhook';
