import { createAction, Property } from '@activepieces/pieces-framework';
import { missiveAuth } from '../../';
import { missiveApiCall } from '../common/utils';

export const findContactAction = createAction({
  auth: missiveAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Search for a contact by email, name, or contact book',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Search for contact by email address',
      required: false,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Search for contact by name',
      required: false,
    }),
    contactBookId: Property.ShortText({
      displayName: 'Contact Book ID',
      description: 'Search within a specific contact book',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of results to return',
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { email, name, contactBookId, limit } = context.propsValue;
    const apiToken = context.auth.apiToken;

    let endpoint = '/contacts';
    const params = new URLSearchParams();

    if (email) params.append('email', email);
    if (name) params.append('name', name);
    if (contactBookId) params.append('contact_book_id', contactBookId);
    if (limit) params.append('limit', limit.toString());

    if (params.toString()) {
      endpoint += `?${params.toString()}`;
    }

    const response = await missiveApiCall(apiToken, endpoint);

    return response;
  },
}); 