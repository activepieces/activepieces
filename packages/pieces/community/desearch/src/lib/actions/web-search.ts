import { createAction, Property } from '@activepieces/pieces-framework';
import { desearchAuth } from '../auth';
import { desearchSearch } from '../search';

export const webSearch = createAction({
  name: 'web_search',
  displayName: 'Web Search',
  description: 'Search the web with Desearch and return titles, links, and snippets.',
  auth: desearchAuth,
  audience: 'both',
  classification: 'SEARCH',
  aiMetadata: {
    description: 'Search the web for titles, links, and snippets matching a query. Returns up to 20 results.',
    idempotent: true,
  },
  props: {
    query: Property.ShortText({ displayName: 'Query', required: true }),
    num: Property.Number({ displayName: 'Result Count', required: false, defaultValue: 10 }),
  },
  async run(context) {
    return desearchSearch.searchWeb({ query: context.propsValue.query, num: context.propsValue.num, auth: context.auth });
  },
});
