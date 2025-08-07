import { createAction, Property } from '@activepieces/pieces-framework';
import { aircallAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const findContact = createAction({
  auth: aircallAuth,
  name: 'findContact',
  displayName: 'Find Contact',
  description: 'Search for contacts based on provided filters',
  props: {
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description:
        'Search by phone number (with country code, e.g., +1234567890)',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search by email address',
      required: false,
    }),
    from: Property.ShortText({
      displayName: 'From Date',
      description: 'Set a minimal creation date for contacts (UNIX timestamp)',
      required: false,
    }),
    to: Property.ShortText({
      displayName: 'To Date',
      description: 'Set a maximal creation date for contacts (UNIX timestamp)',
      required: false,
    }),
    order: Property.StaticDropdown({
      displayName: 'Order',
      description: 'Reorder entries by order_by, created_at otherwise',
      required: false,
      defaultValue: 'asc',
      options: {
        options: [
          { label: 'Ascending', value: 'asc' },
          { label: 'Descending', value: 'desc' },
        ],
      },
    }),
    order_by: Property.StaticDropdown({
      displayName: 'Order By',
      description: 'Set the order field',
      required: false,
      defaultValue: 'created_at',
      options: {
        options: [
          { label: 'Created At', value: 'created_at' },
          { label: 'Updated At', value: 'updated_at' },
        ],
      },
    }),
  },
  async run(context) {
    const { phone_number, email, from, to, order, order_by } =
      context.propsValue;
    

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (phone_number) queryParams.set('phone_number', phone_number);
    if (email) queryParams.set('email', email);
    if (from) queryParams.set('from', from);
    if (to) queryParams.set('to', to);
    if (order) queryParams.set('order', order);
    if (order_by) queryParams.set('order_by', order_by);

    const queryString = queryParams.toString();
    const path = `/contacts/search${queryString ? `?${queryString}` : ''}`;

    const response = await makeRequest( context.auth, HttpMethod.GET, path);

    return response;
  },
});
