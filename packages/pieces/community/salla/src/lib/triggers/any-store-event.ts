import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { ANY_EVENT_RULE_DESCRIPTION, sallaStoreTriggers } from './store-event-trigger';

export const anyStoreEventTrigger = createTrigger({
  auth: sallaAuth,
  name: 'any_store_event',
  displayName: 'Any Store Event',
  description:
    'Triggers on any Salla store event you pick, such as shipments, brands, categories, special offers or branches. Use it for events that have no trigger of their own. Salla has retired product.updated and product.available; use Product Price or Status Changed instead.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once each time the one Salla event picked in Event happens in the connected store, for the long tail of events without a dedicated trigger (shipments, shipping zones, brands, categories, special offers, branches, coupons applied, wallet actions and more). One payload is the raw Salla envelope: event name, store ID, sent time and data, whose fields depend on the event. Prefer the dedicated order, product, customer, cart and review triggers when one fits; product.updated and product.available are retired by Salla and refused.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    event: sallaProps.webhookEvent({
      required: true,
      description:
        'The Salla event that starts the flow. The list comes from your store. Salla has retired product.updated and product.available, so they are refused even if they still show here; use Product Price or Status Changed instead.',
    }),
    rule: sallaProps.webhookRule({ description: ANY_EVENT_RULE_DESCRIPTION }),
  },
  outputSchema: sallaOutputSchemas.anyStoreEvent,
  sampleData: sallaStoreTriggers.anyEventSample(),
  async onEnable(context) {
    const event = sallaStoreTriggers.requireAnyEvent(context.propsValue.event);
    await sallaStoreTriggers.enable({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      event,
      webhookUrl: context.webhookUrl,
      rule: sallaStoreTriggers.ruleFor({ event, rule: context.propsValue.rule }),
    });
  },
  async onDisable(context) {
    await sallaStoreTriggers.disable({ auth: context.auth, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    const event = await sallaStoreTriggers.receive({
      store: context.store,
      storeKey: STORE_KEY,
      event: sallaStoreTriggers.requireAnyEvent(context.propsValue.event),
      payload: context.payload,
    });
    return event ? [sallaStoreTriggers.anyEventOutput(event)] : [];
  },
});

const STORE_KEY = 'salla_any_store_event';
