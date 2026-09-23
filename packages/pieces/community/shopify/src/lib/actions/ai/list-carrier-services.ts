import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCarrierService,
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListCarrierServices = createAction({
  auth: shopifyAuth,
  name: 'list_carrier_services',
  classification: 'SEARCH',
  displayName: 'List Carrier Services',
  description: 'List the carrier-calculated shipping rate services set up on the store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the carrier services that provide live shipping rates at checkout (apps or carriers that Shopify calls for rates), with name, whether active, callback URL and whether they support service discovery. Carrier-calculated rates need the Advanced plan or higher (or a development store), so the list is often empty on smaller plans. Optionally filter with search syntax such as "active:true". Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_shipping access scope. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Optional Shopify search syntax, for example "active:true" or "id:123". Leave empty to list all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the id.',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'ID' },
          { label: 'Created at', value: 'CREATED_AT' },
          { label: 'Updated at', value: 'UPDATED_AT' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      carrierServices: GqlConnection<GqlCarrierService>;
    }>({
      auth,
      query: `query ListCarrierServices($first: Int!, $after: String, $query: String, $sortKey: CarrierServiceSortKeys, $reverse: Boolean) { carrierServices(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.CARRIER_SERVICE_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.carrierServices,
      map: shopifyMappers.mapCarrierService,
      redactedFields,
    });
  },
});
