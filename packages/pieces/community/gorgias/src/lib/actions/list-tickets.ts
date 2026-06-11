import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { gorgiasAuth } from '../auth';
import { gorgiasApiCall, GorgiasListResponse } from '../common/client';

export const listTicketsAction = createAction({
  auth: gorgiasAuth,
  name: 'list_gorgias_tickets',
  displayName: 'List Tickets',
  description: 'List Gorgias tickets with cursor-based pagination support.',
  audience: 'both',
  aiMetadata: { description: 'List Gorgias support tickets, one page at a time, with optional filtering by customer ID and custom ordering. Use to discover or enumerate tickets when you do not have a specific ID; pass the cursor from a prior response to page through results. Idempotent read-only query.', idempotent: true },
  props: {
    customerId: Property.Number({
      displayName: 'Customer ID',
      description: 'Optional customer ID to filter tickets for one customer.',
      required: false,
    }),
    cursor: Property.ShortText({
      displayName: 'Cursor',
      description: 'Optional cursor returned by a previous list response.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of tickets to return in this page. Defaults to 25.',
      required: false,
      defaultValue: 25,
    }),
    orderBy: Property.ShortText({
      displayName: 'Order By',
      description: 'Optional ordering, for example `created_datetime:desc`.',
      required: false,
    }),
  },
  async run(context) {
    const { customerId, cursor, limit, orderBy } = context.propsValue;
    return await gorgiasApiCall<GorgiasListResponse<unknown>>({
      auth: context.auth,
      method: HttpMethod.GET,
      resourceUri: '/tickets',
      query: {
        customer_id: customerId,
        cursor,
        limit: limit ?? 25,
        order_by: orderBy,
      },
    });
  },
});
