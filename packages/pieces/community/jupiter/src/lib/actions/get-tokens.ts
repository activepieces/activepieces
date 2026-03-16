import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getTokens = createAction({
  name: 'get_tokens',
  displayName: 'Get All Tokens',
  description:
    'List all 40 000+ tokens supported by Jupiter DEX. Optionally filter by symbol, name, or mint address.',
  props: {
    search: Property.ShortText({
      displayName: 'Search Filter',
      description:
        'Optional: filter results by token symbol, name, or mint address (client-side).',
      required: false,
    }),
  },
  async run(context) {
    const { search } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://token.jup.ag/all',
    });

    let tokens = response.body as Array<Record<string, string>>;

    if (search && Array.isArray(tokens)) {
      const query = search.toLowerCase();
      tokens = tokens.filter(
        (t) =>
          t['symbol']?.toLowerCase().includes(query) ||
          t['name']?.toLowerCase().includes(query) ||
          t['address']?.toLowerCase().includes(query),
      );
    }

    return tokens;
  },
});
