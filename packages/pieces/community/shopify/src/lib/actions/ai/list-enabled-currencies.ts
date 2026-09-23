import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlCurrencySetting,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListEnabledCurrencies = createAction({
  auth: shopifyAuth,
  name: 'list_enabled_currencies',
  classification: 'SEARCH',
  displayName: 'List Store Currencies',
  description: 'List the currencies the store sells in, with manual exchange rates.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s currency settings: each currency code and name, whether it is enabled for selling, and its manual exchange rate if the merchant set one (null means Shopify converts automatically). Also returns shop_currency_code, the currency the store reports in. Paged: pass end_cursor back as the cursor while has_next_page is true. The required access scope is not documented (expected: none beyond the connection). Read-only.',
    idempotent: true,
  },
  props: {
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      shop: { currencyCode?: string | null; currencySettings: GqlConnection<GqlCurrencySetting> | null };
    }>({
      auth,
      query: `query ListEnabledCurrencies($first: Int!, $after: String) { shop { currencyCode currencySettings(first: $first, after: $after) { nodes { ${shopifyFields.CURRENCY_SETTING_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
      },
      primaryPaths: ['shop.currencySettings'],
    });
    return {
      shop_currency_code: data.shop.currencyCode ?? null,
      ...shopifyMappers.toPage({
        connection: data.shop.currencySettings,
        map: shopifyMappers.mapCurrencySetting,
        redactedFields,
      }),
    };
  },
});
