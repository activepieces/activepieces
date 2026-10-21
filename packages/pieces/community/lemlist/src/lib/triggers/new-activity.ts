import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { lemlistAuth } from '../common/constants';
import { campaignsDropdown } from '../common/props';
import { LEMLIST_EVENT_TYPES } from '../common/events';
import { SAMPLE_ACTIVITY } from '../common/sample';
import { lemlistSchemas } from '../common/schemas';
import { lemlistWebhook } from '../common/webhook';

const CACHE_KEY = 'lemlist_new_activity_trigger_key';

export const newActivity = createTrigger({
  auth: lemlistAuth,
  name: 'newActivity',
  classification: 'READ',
  displayName: 'New Activity',
  description: 'Triggers for each new activity, optionally only some event types or one campaign.',
  aiMetadata: {
    description:
      'Fires once per lemlist activity delivered by webhook (emails sent, opened, clicked, replied, bounced, interest changes, LinkedIn steps, unsubscribes...), optionally only for chosen event types or one campaign. Deliveries are checked against a secret created with the webhook and duplicates are dropped by activity ID. Payload is the activity record.',
  },
  props: {
    eventTypes: Property.StaticMultiSelectDropdown({
      displayName: 'Event Types',
      description: 'Only trigger for these events. Leave empty for every event.',
      required: false,
      options: {
        disabled: false,
        options: LEMLIST_EVENT_TYPES.map((value) => ({ label: value, value })),
      },
    }),
    campaignId: campaignsDropdown({ refreshers: ['auth'], required: false }),
  },
  sampleData: SAMPLE_ACTIVITY,
  outputSchema: lemlistSchemas.activity,
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await lemlistWebhook.enable({
      apiKey: context.auth.secret_text,
      targetUrl: context.webhookUrl,
      store: context.store,
      storeKey: CACHE_KEY,
    });
  },
  async onDisable(context) {
    await lemlistWebhook.disable({
      apiKey: context.auth.secret_text,
      store: context.store,
      storeKey: CACHE_KEY,
    });
  },
  async run(context) {
    const activity = await lemlistWebhook.receive({
      body: context.payload.body,
      store: context.store,
      storeKey: CACHE_KEY,
      nowMs: Date.now(),
      accept: (event) => {
        const wanted = context.propsValue.eventTypes ?? [];
        const campaignId = context.propsValue.campaignId;
        const typeOk = wanted.length === 0 || wanted.includes(String(event['type']));
        const campaignOk =
          typeof campaignId !== 'string' || campaignId.length === 0 || event['campaignId'] === campaignId;
        return typeOk && campaignOk;
      },
    });
    return activity === undefined ? [] : [activity];
  },
});
