import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { deleteRecord, flatten, readPath, seg, toResource } from '../common/client';
import { flatFields, recordSchema } from '../common/output-schemas';

export const cancelSubscription = createAction({
  auth: lemonSqueezyAuth,
  name: 'cancel_subscription',
  displayName: 'Cancel Subscription',
  description: 'Cancel a subscription at the end of its billing period.',
  audience: 'both',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Cancels a subscription at the end of its current billing period; the customer keeps access until then and it can be resumed with Resume Subscription during that grace period. Repeat calls are safe and return the cancelled subscription.',
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
    const body = await deleteRecord({
      apiKey: auth.secret_text,
      path: `/subscriptions/${seg({ value: propsValue.subscriptionId, label: 'Subscription ID' })}`,
    });
    return flatten(toResource(readPath({ value: body, path: ['data'] })));
  },
});
