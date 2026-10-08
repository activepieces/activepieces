import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlTaxonomyCategory,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { searchProductTaxonomyOutputSchema } from '../../output-schemas/products';

const MAX_PAGE_SIZE = 250;

export const shopifyAiSearchProductTaxonomy = createAction({
  auth: shopifyAuth,
  name: 'search_product_taxonomy',
  classification: 'SEARCH',
  displayName: 'Search Product Categories',
  description: 'Search Shopify\'s standard product taxonomy for category ids.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Shopify\'s standard product taxonomy (for example "t-shirts" or "running shoes") and returns categories with their full path, level and id. Pass the id as category_id to create_product_record or update_product_fields. Leave the search empty and give parent_category_id to browse one level down; with neither, the top-level categories are listed. Paged: pass end_cursor back as the cursor while has_next_page is true. Read-only.',
    idempotent: true,
  },
  outputSchema: searchProductTaxonomyOutputSchema,
  props: {
    search: Property.ShortText({
      displayName: 'Search',
      description: 'Words to search for, for example "t-shirts".',
      required: false,
    }),
    parent_category_id: Property.ShortText({
      displayName: 'Parent Category ID',
      description: 'List the direct children of this category, for example "aa-1" or "gid://shopify/TaxonomyCategory/aa-1".',
      required: false,
    }),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      taxonomy: { categories: GqlConnection<GqlTaxonomyCategory> } | null;
    }>({
      auth,
      query: `query SearchProductTaxonomy($first: Int!, $after: String, $search: String, $childrenOf: ID) { taxonomy { categories(first: $first, after: $after, search: $search, childrenOf: $childrenOf) { nodes { ${shopifyFields.TAXONOMY_CATEGORY_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        search: shopifyValues.nonEmpty(propsValue.search),
        childrenOf: shopifyValues.toCategoryGid(propsValue.parent_category_id),
      },
      primaryPaths: ['taxonomy.categories'],
    });
    return shopifyMappers.toPage({
      connection: data.taxonomy?.categories,
      map: shopifyMappers.mapTaxonomyCategory,
      redactedFields,
    });
  },
});
