import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sentAuth } from '../auth';
import { sentProps } from '../common/props';
import { receivedSample } from '../common/sample';
import { sentWebhooks } from '../common/webhooks';

export const newMessageReceived = createTrigger({
  auth: sentAuth,
  name: 'new_message_received',
  classification: 'READ',
  displayName: 'New Message Received',
  description: 'Trigger when Sent receives an inbound message from a contact.',
  aiMetadata: {
    description:
      'Receive one verified Sent message.received event when a contact sends an inbound message. Subscribes only to the received message filter on the selected account or Sender Profile.',
  },
  props: { profile_id: sentProps.profile },
  type: TriggerStrategy.WEBHOOK,
  sampleData: receivedSample,
  onEnable: async (context) =>
    sentWebhooks.enable({
      apiKey: context.auth.secret_text,
      store: context.store,
      webhookUrl: context.webhookUrl,
      flowId: context.flows.current.id,
      profileId: context.propsValue.profile_id,
      selected: ['message.received'],
    }),
  onDisable: async (context) =>
    sentWebhooks.disable({
      apiKey: context.auth.secret_text,
      store: context.store,
    }),
  run: async (context) =>
    sentWebhooks.run({
      apiKey: context.auth.secret_text,
      store: context.store,
      payload: context.payload,
      selected: ['message.received'],
    }),
});
