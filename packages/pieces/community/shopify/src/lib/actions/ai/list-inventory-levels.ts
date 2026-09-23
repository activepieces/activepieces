import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlInventoryLevel,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 70;

export const shopifyAiListInventoryLevels = createAction({
  auth: shopifyAuth,
  name: 'list_inventory_levels',
  classification: 'SEARCH',
  displayName: 'List Inventory Levels',
  description: 'List stock quantities of one item across locations, or of all items at one location.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists inventory levels with their quantities (available, on hand, committed, incoming, reserved, damaged, safety stock, quality control). Give exactly one of inventory_item_id (where is this item stocked, and how much) or location_id (what is stocked at this location). Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_inventory access scope. Read-only.',
    idempotent: true,
  },
  props: {
    inventory_item_id: Property.ShortText({
      displayName: 'Inventory Item ID',
      description: 'List this item\'s levels at every location, numeric or "gid://shopify/InventoryItem/…". Leave empty when giving a location.',
      required: false,
    }),
    location_id: Property.ShortText({
      displayName: 'Location ID',
      description: 'List every item stocked at this location, numeric or "gid://shopify/Location/…". Leave empty when giving an item.',
      required: false,
    }),
    include_inactive: Property.Checkbox({
      displayName: 'Include Inactive',
      description: 'Also return levels that were deactivated. Off by default.',
      required: false,
      defaultValue: false,
    }),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const itemId = shopifyValues.nonEmpty(propsValue.inventory_item_id);
    const locationId = shopifyValues.nonEmpty(propsValue.location_id);
    if ((itemId === undefined) === (locationId === undefined)) {
      throw new Error('Give exactly one of inventory_item_id or location_id.');
    }
    const paging = {
      first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
      after: shopifyValues.nonEmpty(propsValue.after),
      includeInactive: propsValue.include_inactive ?? false,
    };
    if (itemId !== undefined) {
      const id = shopifyGraphqlClient.toGid({ type: 'InventoryItem', id: itemId });
      const { data, redactedFields } = await shopifyGraphqlClient.request<{
        inventoryItem: { id: string; inventoryLevels: GqlConnection<GqlInventoryLevel> } | null;
      }>({
        auth,
        query: `query ListInventoryLevelsByItem($id: ID!, $first: Int!, $after: String, $includeInactive: Boolean) { inventoryItem(id: $id) { id inventoryLevels(first: $first, after: $after, includeInactive: $includeInactive) { nodes { ${shopifyFields.INVENTORY_LEVEL_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
        variables: { id, ...paging },
        primaryPaths: ['inventoryItem.inventoryLevels'],
      });
      if (!data.inventoryItem) {
        throw new Error(`Inventory item ${id} was not found.`);
      }
      return shopifyMappers.toPage({
        connection: data.inventoryItem.inventoryLevels,
        map: shopifyMappers.mapInventoryLevel,
        redactedFields,
      });
    }
    const id = shopifyGraphqlClient.toGid({ type: 'Location', id: locationId ?? '' });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      location: { id: string; inventoryLevels: GqlConnection<GqlInventoryLevel> } | null;
    }>({
      auth,
      query: `query ListInventoryLevelsByLocation($id: ID!, $first: Int!, $after: String, $includeInactive: Boolean) { location(id: $id) { id inventoryLevels(first: $first, after: $after, includeInactive: $includeInactive) { nodes { ${shopifyFields.INVENTORY_LEVEL_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } } }`,
      variables: { id, ...paging },
      primaryPaths: ['location.inventoryLevels'],
    });
    if (!data.location) {
      throw new Error(`Location ${id} was not found.`);
    }
    return shopifyMappers.toPage({
      connection: data.location.inventoryLevels,
      map: shopifyMappers.mapInventoryLevel,
      redactedFields,
    });
  },
});
