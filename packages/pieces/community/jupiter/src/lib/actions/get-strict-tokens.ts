import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';

export const getStrictTokens = createAction({
  name: 'get_strict_tokens',
  displayName: 'Get Strict Token List',
  description:
    "Get Jupiter's curated strict token list — verified, high-quality tokens only. Smaller and safer than the full list.",
  props: {
    search: Property.ShortText({
      displayName: 'Search Filter',
      description: 'Optional: filter strict tokens by symbol, name, or mint address.',
      required: false,
    }),
  },
  async run(context) {
    const { search } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://token.jup.ag/strict',
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
