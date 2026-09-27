import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { googleContactsAuth } from '../auth';
import { googleContactsApi } from '../common';
import { googleContactsPerson } from '../common/person';
import { searchContactsAtomicOutputSchema } from '../output-schemas';

export const googleContactsSearchContactsAtomicAction = createAction({
  auth: googleContactsAuth,
  name: 'search_contacts',
  classification: 'SEARCH',
  displayName: 'Search Contacts',
  description: 'Search the connected account contacts by a plain-text query.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches the connected Google Contacts account for people whose fields prefix-match a plain-text query and returns each match with its resourceName and etag. Use it to resolve a name, email or phone fragment into a resourceName before an update or delete; use List Contacts to enumerate everything instead. Matching is prefix-only ("foo n" matches "foo name", "oo n" does not) and capped at 30 results. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: searchContactsAtomicOutputSchema,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description:
        'Plain-text query prefix-matched against contact fields such as name, email and phone number.',
      required: true,
    }),
    pageSize: Property.Number({
      displayName: 'Page Size',
      description: 'Number of results to return, maximum 30. Defaults to 30.',
      required: false,
    }),
  },
  async run(context) {
    const readMask = googleContactsApi.contactReadMask.join(',');
    const pageSize = Math.min(30, Math.max(1, context.propsValue.pageSize ?? 30));
    try {
      await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.GET,
        path: '/people:searchContacts',
        queryParams: { query: '', readMask, pageSize: '1' },
      });
    } catch (error) {
      throw googleContactsApi.toApiError({
        error,
        operation: 'Search Contacts warm-up',
      });
    }
    try {
      const response = await googleContactsApi.sendRequest({
        accessToken: context.auth.access_token,
        method: HttpMethod.GET,
        path: '/people:searchContacts',
        queryParams: {
          query: context.propsValue.query,
          readMask,
          pageSize: String(pageSize),
        },
      });
      const results = googleContactsApi
        .readArray({ source: response, path: ['results'] })
        .map((result) =>
          googleContactsPerson.summarizePerson({
            person: googleContactsApi.readValue({ source: result, path: ['person'] }),
          })
        );
      return { results, count: results.length };
    } catch (error) {
      throw googleContactsApi.toApiError({ error, operation: 'Search Contacts' });
    }
  },
});
