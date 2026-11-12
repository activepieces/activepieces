import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaCustomers } from '../common/customers';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { CUSTOMER_RULE_DESCRIPTION, sallaStoreTriggers } from './store-event-trigger';

export const newCustomerTrigger = createTrigger({
  auth: sallaAuth,
  name: 'new_customer',
  displayName: 'New Customer',
  description: 'Triggers when a new customer is added to the Salla store.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once for each new customer created in the connected Salla store (Salla event customer.created). One payload is the customer: ID, first and last name, mobile with country code, email, gender, birthday, city, country, customer groups and profile links.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    rule: sallaProps.webhookRule({ description: CUSTOMER_RULE_DESCRIPTION }),
  },
  outputSchema: sallaOutputSchemas.customerEvent,
  sampleData: sallaStoreTriggers.customerSample({ event: 'customer.created' }),
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

const EVENT = 'customer.created';
const STORE_KEY = 'salla_new_customer';
