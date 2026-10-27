import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { arteemisAuth } from '../auth';
import { ArteemisEventType, flattenEvent, SAMPLE_EVENTS } from './events';
import { arteemisWebhook } from './webhook';

/**
 * A trigger on one Arteemis webhook event: publishing the flow creates its own Arteemis endpoint for that event,
 * turning it off deletes it. Arteemis posts each event within a minute, signed with the endpoint's secret.
 */
export function arteemisEventTrigger({
  name,
  event,
  displayName,
  description,
  aiDescription,
}: {
  name: string;
  event: ArteemisEventType;
  displayName: string;
  description: string;
  aiDescription: string;
}) {
  return createTrigger({
    auth: arteemisAuth,
    name,
    classification: 'READ',
    displayName,
    description,
    aiMetadata: { description: aiDescription },
    props: {},
    sampleData: flattenEvent(SAMPLE_EVENTS[event]),
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      await arteemisWebhook.enable({
        apiKey: context.auth.secret_text,
        webhookUrl: context.webhookUrl,
        store: context.store,
        event,
        label: displayName,
      });
    },
    async onDisable(context) {
      await arteemisWebhook.disable({ apiKey: context.auth.secret_text, store: context.store });
    },
    async run(context) {
      const received = await arteemisWebhook.receive({
        payload: context.payload,
        store: context.store,
        event,
        nowMs: Date.now(),
      });
      return received === undefined ? [] : [received];
    },
  });
}
