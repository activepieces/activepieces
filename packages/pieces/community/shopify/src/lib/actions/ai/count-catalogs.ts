import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { GqlCount, shopifyGraphqlClient, shopifyProps, shopifyValues } from '../../common/graphql';
import { storeCountOutputSchema } from '../../output-schemas/store';

export const shopifyAiCountCatalogs = createAction({
  auth: shopifyAuth,
  name: 'count_catalogs',
  classification: 'READ',
  displayName: 'Count Catalogs',
  description: 'Count the store\'s catalogs, optionally by type or search.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts catalogs (market, B2B company-location and app catalogs), optionally only one type or those matching Shopify search syntax such as "status:ACTIVE". Plan requirement: B2B company-location catalogs exist only on Shopify Plus stores, so on other plans only market catalogs count. Shopify stops counting at 10,000; precision is AT_LEAST when it did. The required access scope is not documented. Read-only.',
    idempotent: true,
  },
  props: {
    type: Property.StaticDropdown({
      displayName: 'Catalog Type',
      description: 'Only count catalogs of this type. Leave empty for all types.',
      required: false,
      options: {
        options: [
          { label: 'Market', value: 'MARKET' },
          { label: 'Company location (B2B)', value: 'COMPANY_LOCATION' },
          { label: 'App', value: 'APP' },
          { label: 'None', value: 'NONE' },
        ],
      },
    }),
    query: shopifyProps.searchQuery(
      'Shopify catalog search syntax, for example "status:ACTIVE" or "title:wholesale". Leave empty to count all.'
    ),
  },
  outputSchema: storeCountOutputSchema,
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      catalogsCount: GqlCount | null;
    }>({
      auth,
      query: `query CountCatalogs($type: CatalogType, $query: String) { catalogsCount(type: $type, query: $query) { count precision } }`,
      variables: {
        type: propsValue.type,
        query: shopifyValues.nonEmpty(propsValue.query),
      },
    });
    return {
      count: data.catalogsCount?.count ?? 0,
      precision: data.catalogsCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
