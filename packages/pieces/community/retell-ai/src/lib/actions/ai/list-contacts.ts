import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { retellAiProps } from '../../common/ai-props';
import { retellAiAuth } from '../../common/auth';
import { apiKeyOf, retellApiCall } from '../../common/client';
import { retellInput } from '../../common/input';
import { retellMap } from '../../common/mappers';
import { retellSchemas } from '../../common/schemas';
export const listContactsAction = createAction({
  auth: retellAiAuth,
  name: 'list_contacts',
  classification: 'SEARCH',
  displayName: 'List Contacts',
  description: 'Lists or searches contacts, newest first.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists Retell contacts newest first, optionally matching a search text against phone number, names, external ID and custom fields, with the total number of matches. Pass pagination_key for the next page. Read-only.',
    idempotent: true,
  },
  props: {
    search: Property.ShortText({ displayName: 'Search', description: 'Optional case-insensitive text to match.', required: false }),
    limit: retellAiProps.limit(),
    pagination_key: retellAiProps.paginationKey(),
  },
  outputSchema: retellSchemas.contactPage,
  async run({ auth, propsValue }) {
    const body: Record<string, unknown> = { limit: retellInput.pageLimit(propsValue.limit), sort_order: 'desc' };
    const search = retellInput.optionalText(propsValue.search);
    if (search !== undefined) {
      body['search_query'] = search;
    }
    const paginationKey = retellInput.optionalText(propsValue.pagination_key);
    if (paginationKey !== undefined) {
      body['pagination_key'] = paginationKey;
    }
    const response = await retellApiCall({
      apiKey: apiKeyOf(auth),
      method: HttpMethod.POST,
      path: '/list-contacts',
      body,
      retryRateLimit: true,
    });
    return retellMap.page({ body: response, mapItem: retellMap.contact });
  },
});
