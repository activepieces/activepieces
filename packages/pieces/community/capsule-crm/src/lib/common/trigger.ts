import {
  createTrigger,
  OutputSchema,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from './auth';
import { capsuleCrmClient } from './client';

type TriggerParams = {
  name: string;
  displayName: string;
  description: string;
  aiMetadata: { description: string };
  event: string;
  sampleData: unknown;
  outputSchema: OutputSchema;
};

export const capsuleCrmCreateTrigger = ({
  name,
  displayName,
  description,
  aiMetadata,
  event,
  sampleData,
  outputSchema,
}: TriggerParams) => {
  return createTrigger({
    auth: capsuleCrmAuth,
    name: name,
    classification: 'READ',
    displayName: displayName,
    description: `${description} Capsule allows at most 20 webhooks per account.`,
    aiMetadata: aiMetadata,
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: sampleData,
    outputSchema: outputSchema,
    async onEnable(context) {
      const hook = await capsuleCrmClient.subscribeRestHook({
        auth: context.auth,
        params: {
          targetUrl: context.webhookUrl,
          event: event,
          description: `Activepieces - ${displayName}`,
        },
      });
      try {
        await context.store.put(`capsule_crm_trigger_${name}`, {
          hookId: hook.id,
        });
      } catch (error) {
        await capsuleCrmClient.unsubscribeRestHook({ auth: context.auth, hookId: hook.id }).catch(() => undefined);
        throw error;
      }
    },

    async onDisable(context) {
      const storedData = await context.store.get<{ hookId: number }>(
        `capsule_crm_trigger_${name}`
      );
      if (storedData) {
        await capsuleCrmClient.unsubscribeRestHook({ auth: context.auth, hookId: storedData.hookId });
        await context.store.delete(`capsule_crm_trigger_${name}`);
      }
    },

    async run(context) {
      const body: unknown = context.payload.body;
      if (typeof body !== 'object' || body === null || !('payload' in body) || !Array.isArray(body.payload)) {
        return [];
      }
      return body.payload;
    },
  });
};
