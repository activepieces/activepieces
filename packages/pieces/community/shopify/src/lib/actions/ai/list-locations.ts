import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlLocation,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listLocationsOutputSchema } from '../../output-schemas/products';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListLocations = createAction({
  auth: shopifyAuth,
  name: 'list_locations',
  classification: 'SEARCH',
  displayName: 'List Locations',
  description: 'List the store\'s locations (warehouses, shops, fulfillment services), one page at a time.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s locations with name, address, whether they are active, fulfill online orders or ship inventory, and whether they belong to a fulfillment service. The ids are needed by the inventory actions. Optionally filter with search syntax such as "name:Warehouse*". Inactive and legacy (fulfillment service) locations are left out unless asked for. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_locations access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listLocationsOutputSchema,
  props: {
    query: shopifyProps.searchQuery(
      'Shopify location search syntax, for example "name:Warehouse*". Leave empty to list all.'
    ),
    include_inactive: Property.Checkbox({
      displayName: 'Include Inactive',
      description: 'Also return deactivated locations. Off by default.',
      required: false,
      defaultValue: false,
    }),
    include_legacy: Property.Checkbox({
      displayName: 'Include Legacy',
      description: 'Also return legacy fulfillment-service locations. Off by default.',
      required: false,
      defaultValue: false,
    }),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the name.',
      required: false,
      options: {
        options: [
          { label: 'Name', value: 'NAME' },
          { label: 'ID', value: 'ID' },
          { label: 'Relevance (with a query)', value: 'RELEVANCE' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      locations: GqlConnection<GqlLocation>;
    }>({
      auth,
      query: `query ListLocations($first: Int!, $after: String, $query: String, $includeInactive: Boolean, $includeLegacy: Boolean, $sortKey: LocationSortKeys, $reverse: Boolean) { locations(first: $first, after: $after, query: $query, includeInactive: $includeInactive, includeLegacy: $includeLegacy, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.LOCATION_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        includeInactive: propsValue.include_inactive ?? false,
        includeLegacy: propsValue.include_legacy ?? false,
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.locations,
      map: shopifyMappers.mapLocation,
      redactedFields,
    });
  },
});
