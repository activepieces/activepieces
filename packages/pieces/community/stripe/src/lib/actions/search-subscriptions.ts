import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import Stripe from 'stripe';

import { stripeAuth } from '../..';
import { stripeCommon } from '../common';

interface AugmentedSubscriptionOutput extends Stripe.Subscription {
  customer: string | Stripe.Customer | Stripe.DeletedCustomer;
}
const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Past Due', value: 'past_due' },
  { label: 'Unpaid', value: 'unpaid' },
  { label: 'Canceled', value: 'canceled' },
  { label: 'Incomplete', value: 'incomplete' },
  { label: 'Incomplete Expired', value: 'incomplete_expired' },
  { label: 'Trialing', value: 'trialing' },
  { label: 'Paused', value: 'paused' },
]

export const stripeSearchSubscriptions = createAction({
  name: 'search_subscriptions',
  auth: stripeAuth,
  displayName: 'Search Subscriptions',
  description: 'Search for subscriptions by price ID, status, customer ID and other filters, including customer details',
  props: {
    price_ids: Property.LongText({
      displayName: 'Price IDs',
      description: 'Comma-separated list of price IDs to filter by (e.g., price_1ABC123, price_2DEF456)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Subscription Status',
      description: 'Filter by subscription status',
      required: false,
      options: {
        options: statusOptions
      },
    }),
    customer_id: Property.ShortText({
      displayName: 'Customer ID',
      description: 'Filter by specific customer ID (optional)',
      required: false,
    }),
    created_after: Property.DateTime({
      displayName: 'Created After',
      description: 'Filter subscriptions created after this date (YYYY-MM-DD format)',
      required: false,
    }),
    created_before: Property.DateTime({
      displayName: 'Created Before',
      description: 'Filter subscriptions created before this date (YYYY-MM-DD format)',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of subscriptions to return (default: 100, set to 0 for all)',
      required: false,
      defaultValue: 100,
    }),
    fetch_all: Property.Checkbox({
      displayName: 'Fetch All Results',
      description: 'Fetch all matching subscriptions (ignores limit, may take longer for large datasets)',
      required: false,
      defaultValue: false,
    }),
    include_customer_details: Property.Checkbox({
      displayName: 'Include Customer Details',
      description: 'Fetch detailed customer information for each subscription',
      required: false,
      defaultValue: true,
    }),
  },
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

    let allSubscriptions: Stripe.Subscription[] = [];
    let hasMore = true;
    let startingAfter: string | undefined;
    let requestCount = 0;
    const maxRequests = fetch_all ? 50 : Math.ceil(limit / 100);

    while (hasMore && requestCount < maxRequests) {
      const queryParams = buildQueryParams(startingAfter);

      const subscriptionsResponse = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `${stripeCommon.baseUrl}/subscriptions?${queryParams.toString()}`,
        headers: {
          Authorization: 'Bearer ' + context.auth,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      if (!subscriptionsResponse.body) {
        throw new Error('Failed to fetch subscriptions from Stripe');
      }

      const subscriptions = subscriptionsResponse.body.data as Stripe.Subscription[];
      allSubscriptions = allSubscriptions.concat(subscriptions);

      hasMore = subscriptionsResponse.body.has_more;
      requestCount++;

      if (hasMore && subscriptions.length > 0) {
        startingAfter = subscriptions[subscriptions.length - 1].id;
      }

      if (!fetch_all && allSubscriptions.length >= limit) {
        allSubscriptions = allSubscriptions.slice(0, limit);
        break;
      }
    }

    let filteredSubscriptions = allSubscriptions;

    if (price_ids && price_ids.trim()) {
      const priceIdArray = price_ids
        .split(',')
        .map(id => id.trim())
        .filter(id => id.length > 0);

      if (priceIdArray.length > 0) {
        filteredSubscriptions = filteredSubscriptions.filter((subscription: Stripe.Subscription) => {
          return subscription.items.data.some((item: Stripe.SubscriptionItem) =>
            item.price && typeof item.price === 'object' && priceIdArray.includes(item.price.id)
          );
        });
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
                  Authorization: 'Bearer ' + context.auth,
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
      has_more_available: hasMore && !fetch_all,
      pagination_info: {
        limit_requested: fetch_all ? 'All' : limit,
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