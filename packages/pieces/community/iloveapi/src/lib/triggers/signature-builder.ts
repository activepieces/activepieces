import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { iloveapiAuth } from '../common/auth';
import { iloveSchemas } from '../common/schemas';
import {
  acceptDelivery,
  matchesEvent,
  webhookInstructions,
  webhookSecretProperty,
} from './common';

export function buildSignatureTrigger(spec: SignatureTriggerSpec) {
  return createTrigger({
    auth: iloveapiAuth,
    name: spec.name,
    classification: 'READ',
    displayName: spec.displayName,
    description: spec.description,
    aiMetadata: spec.aiMetadata,
    type: TriggerStrategy.WEBHOOK,
    props: {
      instructions: Property.MarkDown({
        value: webhookInstructions(`${spec.displayName} (${spec.event})`),
      }),
      webhook_secret: webhookSecretProperty,
    },
    outputSchema: iloveSchemas.signatureEvent,
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
      return acceptDelivery({
        envelope,
        store: context.store,
        queryParams: context.payload.queryParams,
        secret: context.propsValue.webhook_secret,
      });
    },
  });
}

export type SignatureTriggerSpec = {
  name: string;
  displayName: string;
  description: string;
  aiMetadata: { description: string };
  event: string;
  sampleData: unknown;
};
