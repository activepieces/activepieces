import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { getRecord, seg } from '../common/client';
import { flatFields, recordSchema } from '../common/output-schemas';

export const getSubscription = createAction({
  auth: lemonSqueezyAuth,
  name: 'get_subscription',
  displayName: 'Get Subscription',
  description: 'Retrieve a subscription by ID.',
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one Lemon Squeezy subscription by numeric subscription ID: status, plan (product/variant), renewal and end dates, pause state, card and customer portal URLs. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: recordSchema(flatFields.subscription),
  props: {
    subscriptionId: Property.ShortText({
      displayName: 'Subscription ID',
      description: 'The numeric ID of the subscription.',
      required: true,
    }),
  },
  async run(context) {
    const { auth, propsValue } = context;
    return getRecord({ apiKey: auth.secret_text, path: `/subscriptions/${seg({ value: propsValue.subscriptionId, label: 'Subscription ID' })}` });
  },
});
