import { createAction, isNil, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import Stripe from 'stripe';

import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

interface AugmentedSubscriptionOutput extends Stripe.Subscription {
  customer: string | Stripe.Customer | Stripe.DeletedCustomer;
}
const statusOptions = [
  { label: 'Active', value: 'active' },
  { label: 'Past Due', value: 'past_due' },
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Canceled', value: 'canceled' },
  { label: 'Incomplete', value: 'incomplete' },
  { label: 'Incomplete Expired', value: 'incomplete_expired' },
  { label: 'Trialing', value: 'trialing' },
  { label: 'Paused', value: 'paused' },
  { label: 'All, Including Canceled', value: 'all' },
]

import { subscriptionSearchOutputSchema } from '../output-schemas';
export const stripeSearchSubscriptions = createAction({
  name: 'search_subscriptions',
  classification: 'SEARCH',
  auth: stripeAuth,
  displayName: 'Search Subscriptions',
  description: 'Find subscriptions by status, customer, price or creation date.',
  audience: 'human',
  aiMetadata: {
    description:
      'Lists and filters Stripe subscriptions by price ID, status, customer ID, and creation date range, optionally expanding full customer details for each. Use to find subscriptions matching criteria or to audit a customer\'s subscriptions; supports paging through all results. Read-only and idempotent.',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'subscription', display: 'builder', label: 'Subscription', icon: 'tag', props: ['status', 'price_ids'] },
    { key: 'customer', display: 'builder', label: 'Customer', icon: 'user', props: ['customer_id'] },
    { key: 'created', display: 'builder', label: 'Created', icon: 'calendar', props: ['created_after', 'created_before'] },
    { key: 'options', display: 'builder', label: 'Options', icon: 'sliders', props: ['fetch_all', 'include_customer_details'] },
    { key: 'footer', display: 'footer', props: ['limit'] },
  ],
  props: {
    price_ids: Property.LongText({
      displayName: 'Price IDs',
      description: 'Comma-separated price IDs.',
      icon: 'tag',
      placeholder: 'price_123, price_456',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Without a status, canceled subscriptions are left out.',
      icon: 'tag',
      required: false,
      options: {
        options: statusOptions
      },
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: "Starts with cus_. Find it on the customer's page in Stripe.",
      icon: 'user',
      placeholder: 'cus_...',
      required: false,
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      description: 'Created on or after this date and time.',
      icon: 'calendar',
      placeholder: '2026-01-31T00:00:00Z',
      required: false,
    }),
    created_before: Property.DateTime({
      displayName: 'Created Before',
      description: 'Created on or before this date and time.',
      icon: 'calendar',
      placeholder: '2026-12-31T23:59:59Z',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      description: 'The most subscriptions to return.',
      required: false,
      defaultValue: 100,
      display: 'stepper',
      min: 1,
      max: 5000,
      step: 1,
    }),
    fetch_all: Property.Checkbox({
      displayName: 'Fetch All Results',
      description: 'Return every match, up to 5,000. Ignores Max Results.',
      icon: 'sliders',
      required: false,
      defaultValue: false,
    }),
    include_customer_details: Property.Checkbox({
      displayName: 'Include Customer Details',
      description: "Add each customer's full record to the results.",
      icon: 'users',
      required: false,
      defaultValue: true,
    }),
  },
  outputSchema: subscriptionSearchOutputSchema,
  async run(context) {
    const {
      price_ids,
      status,
      customer_id,
      created_after,
      created_before,
      limit = 100,
      fetch_all = false,
      include_customer_details = true,
    } = context.propsValue;

    const buildQueryParams = (startingAfter?: string): URLSearchParams => {
      const queryParams = new URLSearchParams();
      queryParams.append('limit', '100');
      queryParams.append('expand[]', 'data.items.data.price');

      if (include_customer_details) {
        queryParams.append('expand[]', 'data.customer');
      }

      if (status) {
        queryParams.append('status', status);
      }

      if (customer_id) {
        queryParams.append('customer', customer_id);
      }

      if (created_after) {
        const afterTimestamp = Math.floor(new Date(created_after).getTime() / 1000);
        queryParams.append('created[gte]', afterTimestamp.toString());
      }

      if (created_before) {
        const beforeTimestamp = Math.floor(new Date(created_before).getTime() / 1000);
        queryParams.append('created[lte]', beforeTimestamp.toString());
      }

      if (startingAfter) {
        queryParams.append('starting_after', startingAfter);
      }

      return queryParams;
    };

    const fetchEverything = fetch_all || isNil(limit) || limit <= 0;
    const priceIdArray = price_ids
      ? price_ids
          .split(',')
          .map(id => id.trim())
          .filter(id => id.length > 0)
      : [];

    let allSubscriptions: Stripe.Subscription[] = [];
    let filteredSubscriptions: Stripe.Subscription[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    let requestCount = 0;
    const maxRequests = fetchEverything || priceIdArray.length > 0 ? 50 : Math.ceil(limit / 100);

    while (hasMore && requestCount < maxRequests) {
      const queryParams = buildQueryParams(startingAfter);

      const subscriptionsResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${stripeCommon.baseUrl}/subscriptions?${queryParams.toString()}`,
        headers: {
          Authorization: 'Bearer ' + context.auth.secret_text,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!subscriptionsResponse.body) {
        throw new Error('Failed to fetch subscriptions from Stripe');
      }

      const subscriptions = subscriptionsResponse.body.data as Stripe.Subscription[];
      allSubscriptions = allSubscriptions.concat(subscriptions);
      filteredSubscriptions = filteredSubscriptions.concat(
        subscriptions.filter((subscription: Stripe.Subscription) =>
          matchesPriceIds({ subscription, priceIds: priceIdArray })
        )
      );

      hasMore = subscriptionsResponse.body.has_more;
      requestCount++;

      if (hasMore && subscriptions.length > 0) {
        startingAfter = subscriptions[subscriptions.length - 1].id;
      }

      if (!fetchEverything && filteredSubscriptions.length >= limit) {
        filteredSubscriptions = filteredSubscriptions.slice(0, limit);
        break;
      }
    }

    const finalSubscriptions: AugmentedSubscriptionOutput[] = await Promise.all(
      filteredSubscriptions.map(async (subscription: Stripe.Subscription) => {
        const resultSubscription: AugmentedSubscriptionOutput = {
          ...subscription,
        };

        if (include_customer_details) {
          if (typeof subscription.customer === 'object' && subscription.customer !== null && !('deleted' in subscription.customer && subscription.customer.deleted)) {
            resultSubscription.customer = subscription.customer as Stripe.Customer;
          } else if (typeof subscription.customer === 'string') {
            try {
              const customerResponse = await httpClient.sendRequest({
                method: HttpMethod.GET,
                url: `${stripeCommon.baseUrl}/customers/${subscription.customer}`,
                headers: {
                  Authorization: 'Bearer ' + context.auth.secret_text,
                },
              });

              resultSubscription.customer = customerResponse.body as Stripe.Customer
            } catch (error) {
              console.warn(`Failed to fetch customer details for ${subscription.customer}:`, error);
            }
          }
        }
        return resultSubscription;
      })
    );

    return {
      success: true,
      count: finalSubscriptions.length,
      total_fetched: allSubscriptions.length,
      requests_made: requestCount,
      has_more_available: hasMore,
      pagination_info: {
        limit_requested: fetchEverything ? 'All' : limit,
        fetch_all_enabled: fetch_all,
        max_requests_limit: maxRequests,
      },
      subscriptions: finalSubscriptions,
      filters_applied: {
        price_ids: price_ids ? price_ids.split(',').map(id => id.trim()).filter(id => id.length > 0) : null,
        status: status || null,
        customer_id: customer_id || null,
        created_after: created_after || null,
        created_before: created_before || null,
        limit: limit,
        fetch_all: fetch_all,
        include_customer_details: include_customer_details,
      },
    };
  },
});

function matchesPriceIds({
  subscription,
  priceIds,
}: {
  subscription: Stripe.Subscription;
  priceIds: string[];
}): boolean {
  if (priceIds.length === 0) {
    return true;
  }
  return subscription.items.data.some((item: Stripe.SubscriptionItem) =>
    item.price && typeof item.price === 'object' && priceIds.includes(item.price.id)
  );
}