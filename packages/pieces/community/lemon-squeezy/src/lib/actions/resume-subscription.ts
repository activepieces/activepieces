import { createAction, Property } from '@activepieces/pieces-framework';
import { lemonSqueezyAuth } from '../common/auth';
import { numericId, patchRecord, seg } from '../common/client';
import { flatFields, recordSchema } from '../common/output-schemas';

export const resumeSubscription = createAction({
  auth: lemonSqueezyAuth,
  name: 'resume_subscription',
  displayName: 'Resume Subscription',
  description: 'Undo a cancellation during the grace period.',
  audience: 'both',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Resumes a cancelled Lemon Squeezy subscription that is still in its grace period (status cancelled, ends_at in the future), so it renews again. Expired subscriptions cannot be resumed. Idempotent.',
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
    return patchRecord({ apiKey: auth.secret_text, type: 'subscriptions', path: `/subscriptions/${seg({ value: id, label: 'Subscription ID' })}`, id: id, attributes: { cancelled: false } });
  },
});
