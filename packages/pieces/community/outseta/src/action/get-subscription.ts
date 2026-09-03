import {
  createAction,
  isNil,
  Property,
  tryCatch,
} from '@activepieces/pieces-framework';
import { outsetaAuth } from '../auth';
import { OutsetaClient } from '../common/client';
import { outsetaErrors } from '../common/errors';
import { outsetaLookup } from '../common/lookup';
import { outsetaMappers } from '../common/mappers';
import { OutsetaAccount, OutsetaSubscription } from '../common/outseta-types';

export const getSubscriptionAction = createAction({
  name: 'get_subscription',
  auth: outsetaAuth,
  displayName: 'Retrieve Subscription',
  description:
    "Retrieve a subscription by its UID, or an account's current subscription by account UID. Returns plan, billing term, quantity, rate, all four dates, discount and add-ons. Returns found=false when nothing matches.",
  audience: 'both',
  classification: 'READ',
  aiMetadata: {
    description:
      "Fetches a subscription by its UID, or an account's current subscription by account UID, returning plan, billing term, quantity, rate, discount, add-ons and the four distinct dates: start, end, expiration and renewal. Outseta has no subscription status field — use the dates to decide whether it is active. Fill exactly one lookup field. Returns found=false instead of failing. Read-only and idempotent.",
    idempotent: true,
  },
  propertyGroups: [
    {
      key: 'lookup',
      display: 'tabs',
      label: 'Find subscription by',
      description: 'Fill one of the two — whichever tab you leave filled is the one used.',
      props: ['subscriptionUid', 'accountUid'],
    },
  ],
  props: {
    subscriptionUid: Property.ShortText({
      displayName: 'Subscription UID',
      required: false,
      placeholder: 'dQG7vBzQ',
    }),
    accountUid: Property.ShortText({
      displayName: 'Account UID',
      description: "Resolved to that account's current subscription.",
      required: false,
      placeholder: '1QpnM0nW',
    }),
  },
  async run(context) {
    const client = new OutsetaClient({
      domain: context.auth.props.domain,
      apiKey: context.auth.props.apiKey,
      apiSecret: context.auth.props.apiSecret,
    });

    const lookup = outsetaLookup.single([
      {
        key: 'subscriptionUid',
        label: 'Subscription UID',
        value: context.propsValue.subscriptionUid,
      },
      { key: 'accountUid', label: 'Account UID', value: context.propsValue.accountUid },
    ]);

    const subscriptionUid =
      lookup.key === 'subscriptionUid'
        ? lookup.value
        : await currentSubscriptionUid({ client, accountUid: lookup.value });

    const subscription = isNil(subscriptionUid)
      ? null
      : await subscriptionByUid({ client, uid: subscriptionUid });

    if (isNil(subscription)) {
      return { found: false, ...outsetaMappers.subscription({}) };
    }

    return { found: true, ...outsetaMappers.subscription(subscription) };
  },
});

async function subscriptionByUid({
  client,
  uid,
}: {
  client: OutsetaClient;
  uid: string;
}): Promise<OutsetaSubscription | null> {
  const { data, error } = await tryCatch(() =>
    client.get<OutsetaSubscription>(
      `/api/v1/billing/subscriptions/${uid}?${SUBSCRIPTION_FIELDS}`
    )
  );

  if (error) {
    if (outsetaErrors.isNotFound(error)) {
      return null;
    }
    throw error;
  }

  return data;
}

async function currentSubscriptionUid({
  client,
  accountUid,
}: {
  client: OutsetaClient;
  accountUid: string;
}): Promise<string | null> {
  const { data, error } = await tryCatch(() =>
    client.get<OutsetaAccount>(
      `/api/v1/crm/accounts/${accountUid}?fields=Uid,CurrentSubscription.Uid`
    )
  );

  if (error) {
    if (outsetaErrors.isNotFound(error)) {
      return null;
    }
    throw error;
  }

  return data.CurrentSubscription?.Uid ?? null;
}

const SUBSCRIPTION_FIELDS =
  'fields=*,Plan.Uid,Plan.Name,Plan.PlanFamily.Name,Account.Uid,Account.Name,LatestInvoice.Uid,LatestInvoice.Number,SubscriptionAddOns.Quantity,SubscriptionAddOns.Rate,SubscriptionAddOns.AddOn.Uid,SubscriptionAddOns.AddOn.Name';
