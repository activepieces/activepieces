import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { sallaAuth } from '../auth';
import { sallaMarketing } from '../common/marketing';
import { sallaOutputSchemas } from '../common/output-schemas';
import { sallaProps } from '../common/props';
import { REVIEW_ADDED_EVENT, REVIEW_RULE_DESCRIPTION, sallaStoreTriggers } from './store-event-trigger';

export const newReviewTrigger = createTrigger({
  auth: sallaAuth,
  name: 'new_review',
  displayName: 'New Review',
  description: 'Triggers when a customer adds a review in the Salla store.',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fires once for each new review added in the connected Salla store (Salla event review.added). One payload is the review: type, star rating, text, the customer, the product (ID and name) and the order it came from. Salla does not send a review ID.',
  },
  type: TriggerStrategy.WEBHOOK,
  props: {
    rule: sallaProps.webhookRule({ description: REVIEW_RULE_DESCRIPTION }),
  },
  outputSchema: sallaOutputSchemas.reviewEvent,
  sampleData: sallaStoreTriggers.reviewSample(),
  async onEnable(context) {
    await sallaStoreTriggers.enable({
      auth: context.auth,
      store: context.store,
      storeKey: STORE_KEY,
      event: REVIEW_ADDED_EVENT,
      webhookUrl: context.webhookUrl,
      rule: sallaStoreTriggers.ruleFor({ event: REVIEW_ADDED_EVENT, rule: context.propsValue.rule }),
    });
  },
  async onDisable(context) {
    await sallaStoreTriggers.disable({ auth: context.auth, store: context.store, storeKey: STORE_KEY });
  },
  async run(context) {
    const event = await sallaStoreTriggers.receive({
      store: context.store,
      storeKey: STORE_KEY,
      event: REVIEW_ADDED_EVENT,
      payload: context.payload,
    });
    return event ? [sallaStoreTriggers.eventOutput({ event, extras: sallaMarketing.withReviewExtras })] : [];
  },
  async test(context) {
    return sallaStoreTriggers.testReviewOutputs({ auth: context.auth });
  },
});

const STORE_KEY = 'salla_new_review';
