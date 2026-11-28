import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaCustomers } from '../common/customers';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { CUSTOMER_RULE_DESCRIPTION, sallaStoreTriggers } from './store-event-trigger';

export const customerUpdatedTrigger = createTrigger({
  auth: sallaAuth,
  name: 'customer_updated',
  displayName: 'Customer Updated',
  description: "Triggers when a customer's profile changes in the Salla store.",
  classification: 'READ',
  aiMetadata: {
    description:
      "Fires each time a customer's profile changes in the connected Salla store (Salla event customer.updated), once per change. One payload is the whole customer record after the change (ID, name, mobile, email, gender, city, country, groups), not only the changed fields, so it does not say which field changed. Use New Customer for sign-ups.",
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    rule: sallaProps.webhookRule({ description: CUSTOMER_RULE_DESCRIPTION }),
  },
  outputSchema: sallaOutputSchemas.customerEvent,
  sampleData: sallaStoreTriggers.customerSample({ event: 'customer.updated' }),
  async onEnable(context) {
    await sallaStoreTriggers.enable({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      event: EVENT,
      webhookUrl: context.webhookUrl,
      rule: sallaStoreTriggers.ruleFor({ event: EVENT, rule: context.propsValue.rule }),
    });
  },
  async onDisable(context) {
    await sallaStoreTriggers.disable({ auth: context.auth, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    const event = await sallaStoreTriggers.receive({
      store: context.store,
      storeKey: STORE_KEY,
      event: EVENT,
      payload: context.payload,
    });
    return event ? [sallaStoreTriggers.eventOutput({ event, extras: sallaCustomers.withCustomerExtras })] : [];
  },
  async test(context) {
    return sallaStoreTriggers.testCustomerOutputs({ auth: context.auth, event: EVENT });
  },
});

const EVENT = 'customer.updated';
const STORE_KEY = 'salla_customer_updated';
