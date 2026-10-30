import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { apiErrorStatus, systemeIoCommon, systemeIoInput } from '../common/client';
import { contactPicker, subscriptionDropdown } from '../common/dropdowns';
import { cancelSubscriptionOutputSchema } from '../output-schemas';

export const cancelSubscription = createAction({
  auth: systemeIoAuth,
  name: 'cancel_subscription',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Subscription',
  description: "Cancel one of a contact's subscriptions, now or at the end of the billing period",
  audience: 'both',
  aiMetadata: {
    description:
      "Cancels a Systeme.io subscription, either immediately or when the current billing period ends (the default and safer choice). Needs the contact id and the subscription id; it first checks that the subscription belongs to that contact and cancels nothing otherwise. With the end-of-period option the subscription stays active until the period ends. Idempotent: a subscription that is already cancelled is reported with already_cancelled=true and not cancelled again; if Systeme.io refuses a repeat end-of-period cancel, the action converges when the subscription is already set to end.",
    idempotent: true,
  },
  props: {
    contact_id: contactPicker({ required: true }),
    subscription_id: subscriptionDropdown,
    cancel: Property.StaticDropdown({
      displayName: 'When',
      description: "'WhenBillingPeriodEnds' (default) keeps access until the paid period ends; 'Now' cancels immediately.",
      required: true,
      defaultValue: 'WhenBillingPeriodEnds',
      options: {
        disabled: false,
        options: [
          { label: 'At the end of the billing period', value: 'WhenBillingPeriodEnds' },
          { label: 'Immediately', value: 'Now' },
        ],
      },
    }),
  },
  outputSchema: cancelSubscriptionOutputSchema,
  async run(context) {
    const p = context.propsValue;
    return cancel({
      apiKey: context.auth.secret_text,
      contactId: p.contact_id,
      subscriptionId: p.subscription_id,
      when: p.cancel,
    });
  },
});

async function cancel({
  apiKey,
  contactId,
  subscriptionId,
  when,
}: {
  apiKey: string;
  contactId: unknown;
  subscriptionId: unknown;
  when: unknown;
}) {
  const contact = systemeIoInput.requireId({ value: contactId, name: 'Contact' });
  const subscription = systemeIoInput.requireId({ value: subscriptionId, name: 'Subscription' });
  if (when !== undefined && when !== null && when !== '' && when !== 'Now' && when !== 'WhenBillingPeriodEnds') {
    throw new Error("When must be 'Now' or 'WhenBillingPeriodEnds'.");
  }
  const cancelType = when === 'Now' ? 'Now' : 'WhenBillingPeriodEnds';
  const result = ({ already }: { already: boolean }) => ({
    cancelled: true,
    already_cancelled: already,
    subscription_id: subscription,
    contact_id: contact,
    cancel_type: cancelType,
  });
  const current = await findSubscription({ apiKey, contact, subscription });
  if (current.status === 'cancelled') {
    return result({ already: true });
  }
  try {
    await systemeIoCommon.apiCall({
      method: HttpMethod.POST,
      url: `/payment/subscriptions/${subscription}/cancel`,
      auth: apiKey,
      body: { cancel: cancelType },
    });
    return result({ already: false });
  } catch (error) {
    if (apiErrorStatus(error) !== 422) {
      throw error;
    }
    const after = await findSubscription({ apiKey, contact, subscription }).catch(() => undefined);
    if (after && isAlreadyCancelled({ row: after, cancelType })) {
      return result({ already: true });
    }
    throw error;
  }
}

async function findSubscription({ apiKey, contact, subscription }: { apiKey: string; contact: number; subscription: number }) {
  const { items, hasMore } = await systemeIoCommon.paginate<Subscription>({
    auth: apiKey,
    url: '/payment/subscriptions',
    query: { contact },
    maxItems: 1000,
  });
  const row = items.find((item) => Number(item.id) === subscription);
  if (row) {
    return row;
  }
  throw new Error(
    hasMore
      ? `Subscription ${subscription} is not among the first 1,000 subscriptions of contact ${contact}, so it was not cancelled.`
      : `Subscription ${subscription} does not belong to contact ${contact}, so nothing was cancelled. Pick one of the contact's subscriptions.`,
  );
}

function isAlreadyCancelled({ row, cancelType }: { row: Subscription; cancelType: string }): boolean {
  if (row.status === 'cancelled') {
    return true;
  }
  const scheduled = row.status === 'active' && typeof row.cancelledAt === 'string' && row.cancelledAt !== '';
  return scheduled && cancelType === 'WhenBillingPeriodEnds';
}

type Subscription = { id?: unknown; status?: string; cancelledAt?: string | null };
