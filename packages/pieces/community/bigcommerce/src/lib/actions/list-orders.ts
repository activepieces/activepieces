import { createAction, Property } from '@activepieces/pieces-framework';
import { bigcommerceAuth } from '../common/auth';
import { pagingProps } from '../common/props';
import { bigCommerceApiService } from '../common/requests';
import { orderListOutputSchema } from '../common/schemas';
import { parseIsoDate, validatePaging } from '../common/shared-runs';

export const listOrders = createAction({
  auth: bigcommerceAuth,
  name: 'listOrders',
  classification: 'SEARCH',
  displayName: 'List Orders',
  description: 'Lists orders, optionally filtered by customer, status and creation date. Returns up to 250 orders per page.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists orders from a BigCommerce store as an array. Optionally filter by customer_id, status_id (get ids from List Order Statuses) and an ISO 8601 created-date range. Returns one page: limit (1-250, default 50) and page (from 1) control paging; request the next page while a page comes back full. Returns [] when nothing matches. Read-only.',
    idempotent: true,
  },
  outputSchema: orderListOutputSchema,
  props: {
    customer_id: Property.Number({
      displayName: 'Customer ID',
      description: 'Filter by customer ID',
      required: false,
    }),
    status_id: Property.Number({
      displayName: 'Status ID',
      description: 'Filter by status ID. Use List Order Statuses to find the IDs.',
      required: false,
    }),
    min_date_created: Property.ShortText({
      displayName: 'Created On or After',
      description: 'ISO 8601 date or date-time, for example 2026-01-31 or 2026-01-31T15:00:00Z.',
      required: false,
    }),
    max_date_created: Property.ShortText({
      displayName: 'Created On or Before',
      description: 'ISO 8601 date or date-time, for example 2026-02-28 or 2026-02-28T23:59:59Z.',
      required: false,
    }),
    ...pagingProps,
  },
  async run(context) {
    const { customer_id, status_id, min_date_created, max_date_created, limit, page } = context.propsValue;
    const paging = validatePaging({ limit, page });
    const minDate = parseIsoDate({ value: min_date_created, field: 'Created On or After' });
    const maxDate = parseIsoDate({ value: max_date_created, field: 'Created On or Before' });

    return await bigCommerceApiService.fetchOrders({
      auth: context.auth.props,
      query: {
        customer_id,
        status_id,
        min_date_created: minDate,
        max_date_created: maxDate,
        ...paging,
      },
    });
  },
});
