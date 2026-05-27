import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { gorgiasAuth } from '../../';
import { gorgiasApi } from '../common/client';
import { gorgiasTicket, GorgiasTicket } from '../common/ticket';

export const listTickets = createAction({
  auth: gorgiasAuth,
  name: 'list_tickets',
  displayName: 'List Tickets',
  description: 'Retrieve a list of tickets, most recently created first.',
  props: {
    order_by: Property.StaticDropdown({
      displayName: 'Sort Order',
      required: false,
      defaultValue: 'created_datetime:desc',
      options: {
        options: [
          { label: 'Newest created first', value: 'created_datetime:desc' },
          { label: 'Oldest created first', value: 'created_datetime:asc' },
          { label: 'Most recently updated first', value: 'updated_datetime:desc' },
          { label: 'Least recently updated first', value: 'updated_datetime:asc' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of tickets to return (1-100).',
      required: false,
      defaultValue: 30,
    }),
  },
  async run(context) {
    const limit = Math.min(Math.max(context.propsValue.limit ?? 30, 1), 100);
    const response = await gorgiasApi.call<{ data: GorgiasTicket[] }>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: '/tickets',
      queryParams: {
        limit: String(limit),
        order_by: context.propsValue.order_by ?? 'created_datetime:desc',
      },
    });
    return response.body.data.map((ticket) => gorgiasTicket.flattenTicket(ticket));
  },
});
