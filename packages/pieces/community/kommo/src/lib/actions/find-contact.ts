import { createAction, Property } from '@activepieces/pieces-framework';
import { kommoAuth } from '../../index';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findContactAction = createAction({
  auth: kommoAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Finds an existing contact.',
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      required: true,
      description: 'Search query (Searches through the filled fields of the contact).'
    }),
  },
  async run(context) {
    const { query } = context.propsValue;
    const { subdomain, apiToken } = context.auth

    const result = await makeRequest(
      { apiToken, subdomain },
      HttpMethod.GET,
      `/contacts?query=${encodeURIComponent(query)}`
    );

    const contacts = result?._embedded?.contacts ?? [];

    return {
      found: contacts.length > 0,
      result: contacts
    };
  },
});
