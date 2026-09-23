import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlLocale,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiListAvailableLocales = createAction({
  auth: shopifyAuth,
  name: 'list_available_locales',
  classification: 'SEARCH',
  displayName: 'List Available Locales',
  description: 'List every language locale Shopify supports.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every locale Shopify supports (ISO code such as "fr" or "pt-BR" and its name). This is Shopify\'s full catalogue of languages a shop could enable, not the languages this shop has published. Returns the full list in one call (no paging). No access scope needed. Read-only.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      availableLocales: GqlLocale[] | null;
    }>({
      auth,
      query: `query ListAvailableLocales { availableLocales { ${shopifyFields.LOCALE_FIELDS} } }`,
    });
    const items = (data.availableLocales ?? []).map(shopifyMappers.mapLocale);
    return {
      items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});
