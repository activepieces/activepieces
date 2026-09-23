import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlPublication,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListPublications = createAction({
  auth: shopifyAuth,
  name: 'list_publications',
  classification: 'SEARCH',
  displayName: 'List Publications',
  description: 'List the publications (sales channels and catalogs) products can be published to.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s publications, the targets that publish_resource and unpublish_resource take (for example the Online Store, Point of Sale or a market catalog), with their title and whether new products are published automatically. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_publications access scope. Read-only.',
    idempotent: true,
  },
  props: {
    catalog_type: Property.StaticDropdown({
      displayName: 'Catalog Type',
      description: 'Only list publications of this catalog type. Leave empty for all.',
      required: false,
      options: {
        options: [
          { label: 'App (sales channel)', value: 'APP' },
          { label: 'Market', value: 'MARKET' },
          { label: 'Company location (B2B)', value: 'COMPANY_LOCATION' },
          { label: 'None', value: 'NONE' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      publications: GqlConnection<GqlPublication>;
    }>({
      auth,
      query: `query ListPublications($first: Int!, $after: String, $catalogType: CatalogType, $reverse: Boolean) { publications(first: $first, after: $after, catalogType: $catalogType, reverse: $reverse) { nodes { ${shopifyFields.PUBLICATION_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        catalogType: propsValue.catalog_type,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.publications,
      map: shopifyMappers.mapPublication,
      redactedFields,
    });
  },
});
