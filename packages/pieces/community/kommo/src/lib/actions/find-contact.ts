import { createAction, Property } from '@activepieces/pieces-framework';
import { kommoAuth } from '../auth';
import { makeRequest } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const findContactAction = createAction({
  auth: kommoAuth,
  name: 'find_contact',
  displayName: 'Find Contact',
  description: 'Finds an existing contact.',
  audience: 'both',
  aiMetadata: { description: 'Searches contacts in a Kommo CRM account by a free-text query matched against the contacts\' filled fields, returning all matching contacts. Use to resolve a contact (e.g. by name, email, or phone) before referencing or updating it; the query is required. Read-only and idempotent.', idempotent: true },
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      required: true,
      description: 'Search query (Searches through the filled fields of the contact).'
    }),
  },
  async run(context) {
    const { query } = context.propsValue;
    const { subdomain, apiToken } = context.auth.props

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
