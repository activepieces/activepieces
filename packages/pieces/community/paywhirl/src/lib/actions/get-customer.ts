import { createAction, Property } from '@activepieces/pieces-framework';
import { paywhirlAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getCustomer = createAction({
  auth: paywhirlAuth,
  name: 'getCustomer',
  displayName: 'Get Customers',
  description:
    'Retrieve a selection of customers. Useful for keeping track of customers in a local database.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of entries to return. Limit 100.',
      required: false,
    }),
    order_key: Property.ShortText({
      displayName: 'Order Key',
      description: 'Field to sort by. Default: id',
      required: false,
    }),
    order_direction: Property.StaticDropdown({
      displayName: 'Order Direction',
      description: 'Direction to order results',
      options: {
        disabled: false,
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
      required: false,
    }),
    before_id: Property.Number({
      displayName: 'Before ID',
      description: 'All customers returned will have an ID less than this value',
      required: false,
    }),
    after_id: Property.Number({
      displayName: 'After ID',
      description: 'All customers returned will have an ID greater than this value',
      required: false,
    }),
    keyword: Property.ShortText({
      displayName: 'Keyword',
      description: 'Filter by keyword',
      required: false,
    }),
  },
  async run(context) {
    const { limit, order_key, order_direction, before_id, after_id, keyword } =
      context.propsValue;

    const queryParams = new URLSearchParams();

    if (limit) queryParams.append('limit', limit.toString());
    if (order_key) queryParams.append('order_key', order_key);
    if (order_direction) queryParams.append('order_direction', order_direction);
    if (before_id) queryParams.append('before_id', before_id.toString());
    if (after_id) queryParams.append('after_id', after_id.toString());
    if (keyword) queryParams.append('keyword', keyword);

    const path = `/customers${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

    const response = await makeRequest(
      context.auth.props.api_key,
      context.auth.props.api_secret,
      HttpMethod.GET,
      path
    );

    return response;
  },
});
