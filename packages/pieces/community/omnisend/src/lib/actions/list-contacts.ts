import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { omnisendAuth } from '../auth';
import { omnisendRequest } from '../common/client';

export const listContactsAction = createAction({
  auth: omnisendAuth,
  name: 'list_contacts',
  displayName: 'List Contacts',
  description: 'Retrieve a paginated list of contacts from Omnisend.',
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Number of contacts to return (max 250).',
      required: false,
      defaultValue: 50,
    }),
    offset: Property.Number({
      displayName: 'Offset',
      description: 'Number of contacts to skip for pagination.',
      required: false,
      defaultValue: 0,
    }),
    email: Property.ShortText({
      displayName: 'Filter by Email',
      description: 'Filter contacts by email address.',
      required: false,
    }),
  },
  async run(context) {
    const { limit, offset, email } = context.propsValue;

    const queryParams: Record<string, string> = {};
    if (limit !== undefined && limit !== null) queryParams['limit'] = String(limit);
    if (offset !== undefined && offset !== null) queryParams['offset'] = String(offset);
    if (email) queryParams['email'] = email;

    return omnisendRequest(
      HttpMethod.GET,
      '/contacts',
      context.auth.secret_text,
      undefined,
      queryParams,
    );
  },
});
