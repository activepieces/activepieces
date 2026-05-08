import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { matchesEvent, webhookInstructions } from './common';

export type SignatureTriggerSpec = {
  name: string;
  displayName: string;
  description: string;
  event: string;
  sampleData: unknown;
};

export function buildSignatureTrigger(spec: SignatureTriggerSpec) {
  return createTrigger({
    auth: iloveapiAuth,
    name: spec.name,
    displayName: spec.displayName,
    description: spec.description,
    type: TriggerStrategy.WEBHOOK,
    props: {
      instructions: Property.MarkDown({
        value: webhookInstructions(`${spec.displayName} (${spec.event})`),
      }),
    },
    sampleData: spec.sampleData,
    async onEnable() {
      return;
    },
    async onDisable() {
      return;
    },
    async run(context) {
      const envelope = matchesEvent({
        body: context.payload.body,
        expectedEvent: spec.event,
      });
      if (!envelope) return [];
      return [envelope];
    },
  });
}
