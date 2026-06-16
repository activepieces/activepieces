import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
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
}: {
  name: string;
  displayName: string;
  description: string;
  aiMetadata?: { description: string };
  event: string;
  sampleData: Record<string, unknown>;
}) {
  return createTrigger({
    auth: streakAuth,
    name,
    displayName,
    description,
    aiMetadata,
    type: TriggerStrategy.WEBHOOK,
    props: {
      pipelineKey: pipelineDropdown,
    },
    sampleData,
    async onEnable(context) {
      const webhook = await createPipelineWebhook({
        apiKey: context.auth.secret_text,
        pipelineKey: context.propsValue.pipelineKey as string,
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
      const body = context.payload.body as any
      return [body];
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
}: {
  name: string;
  displayName: string;
  description: string;
  aiMetadata?: { description: string };
  event: string;
  sampleData: Record<string, unknown>;
}) {
  return createTrigger({
    auth: streakAuth,
    name,
    displayName,
    description,
    aiMetadata,
    type: TriggerStrategy.WEBHOOK,
    props: {
      teamKey: teamDropdown,
    },
    sampleData,
    async onEnable(context) {
      const webhook = await createTeamWebhook({
        apiKey: context.auth.secret_text,
        teamKey: context.propsValue.teamKey as string,
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
      const body = context.payload.body as any;
      return [body];
    },
  });
}

const STORE_KEY = 'streak_webhook';
