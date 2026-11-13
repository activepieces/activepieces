import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { numericId, patchRecord, seg } from '../common/client';
import { flatFields, recordSchema } from '../common/output-schemas';

export const unpauseSubscription = createAction({
  auth: lemonSqueezyAuth,
  name: 'unpause_subscription',
  displayName: 'Unpause Subscription',
  description: 'Resume payment collection on a paused subscription.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Ends the pause on a paused Lemon Squeezy subscription so payment collection restarts. Idempotent: unpausing a subscription that is not paused changes nothing.',
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
    const id = numericId({ value: propsValue.subscriptionId, label: 'Subscription ID' });
    return patchRecord({ apiKey: auth.secret_text, type: 'subscriptions', path: `/subscriptions/${seg({ value: id, label: 'Subscription ID' })}`, id: id, attributes: { pause: null } });
  },
});
