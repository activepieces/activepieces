import {
  createTrigger,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { capsuleCrmAuth } from './auth';
import { capsuleCrmClient } from './client';

type TriggerParams = {
  name: string;
  displayName: string;
  description: string;
  event: string;
  sampleData: unknown;
};

export const capsuleCrmCreateTrigger = ({
  name,
  displayName,
  description,
  event,
  sampleData,
}: TriggerParams) => {
  return createTrigger({
    auth: capsuleCrmAuth,
    name: name,
    displayName: displayName,
    description: description,
    props: {},
    type: TriggerStrategy.WEBHOOK,
    sampleData: sampleData,

    async onEnable(context) {
      const hook = await capsuleCrmClient.subscribeRestHook(context.auth, {
        targetUrl: context.webhookUrl,
        event: event,
        description: `Activepieces - ${displayName}`,
      });
      await context.store.put(`capsule_crm_trigger_${name}`, {
        hookId: hook.id,
      });
    },

    async onDisable(context) {
      const storedData = await context.store.get<{ hookId: number }>(
        `capsule_crm_trigger_${name}`
      );
      if (storedData) {
        await capsuleCrmClient.unsubscribeRestHook(context.auth, storedData.hookId);
      }
    },

    async run(context) {
      const body = context.payload.body as { payload: unknown[] };
      return body.payload;
    },
  });
};
