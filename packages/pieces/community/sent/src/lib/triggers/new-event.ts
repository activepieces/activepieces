import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sentAuth } from '../auth';
import { sentEvents } from '../common/events';
import { sentProps } from '../common/props';
import { receivedSample } from '../common/sample';
import { sentWebhooks } from '../common/webhooks';

export const newEvent = createTrigger({
  auth: sentAuth,
  name: 'new_event',
  classification: 'READ',
  displayName: 'New Event',
  description: 'Trigger when a selected Sent webhook event occurs.',
  aiMetadata: {
    description:
      'Receive one native Sent webhook envelope for each selected message or template event. The subscription is registered and removed automatically, and incoming signatures are verified.',
  },
  props: { profile_id: sentProps.profile, events: sentEvents.selector },
  type: TriggerStrategy.WEBHOOK,
  sampleData: receivedSample,
  onEnable: async (context) =>
    sentWebhooks.enable({
      apiKey: context.auth.secret_text,
      store: context.store,
      webhookUrl: context.webhookUrl,
      flowId: context.flows.current.id,
      profileId: context.propsValue.profile_id,
      selected: context.propsValue.events,
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
      selected: context.propsValue.events,
    }),
});
