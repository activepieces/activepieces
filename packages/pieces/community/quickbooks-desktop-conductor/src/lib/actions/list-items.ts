import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { spreadIfDefined } from '@activepieces/pieces-framework';
import { quickbooksDesktopConductorAuth } from '../auth';
import { conductorClient, ConductorAuth } from '../common/client';
import { listItemsActionOutputSchema } from '../output-schemas';

const MAX_PAGE_SIZE = 150;

type ItemType = 'service' | 'non_inventory';

type ConductorItem = {
  id: string;
  name: string;
  fullName: string;
  isActive: boolean;
};

type ConductorItemListResponse = {
  data: ConductorItem[];
  hasMore: boolean;
};

function flattenItem({ item, itemType }: { item: ConductorItem; itemType: ItemType }) {
  return {
    id: item.id,
    name: item.name,
    full_name: item.fullName,
    item_type: itemType,
    is_active: item.isActive,
  };
}

export const listItemsAction = createAction({
  auth: quickbooksDesktopConductorAuth,
  name: 'list_items',
  classification: 'SEARCH',
  displayName: 'List Items',
  description: 'Lists Service and Non-Inventory items from QuickBooks Desktop, for finding the exact item name to use in Create Invoice\'s line items.',
  audience: 'both',
  aiMetadata: {
    description:
      'Search QuickBooks Desktop\'s Service and Non-Inventory items by name — the two item types Create Invoice\'s line items accept. Use this to find the exact item name before calling Create Invoice, instead of guessing; typing an item name Create Invoice can\'t find fails with a clear error naming the bad value, but this avoids that round-trip. Read-only and safe to retry.',
    idempotent: true,
  },
  outputSchema: listItemsActionOutputSchema,
  props: {
    nameContains: Property.ShortText({
      displayName: 'Name Contains',
      description: 'Search by a substring of the item name. Leave empty to list all items.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      defaultValue: 'active',
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Either', value: 'all' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Max Results (per item type)',
      description: `Results per item type — up to twice this many total, since Service and Non-Inventory items are searched together (1–${MAX_PAGE_SIZE}).`,
      required: false,
      defaultValue: MAX_PAGE_SIZE,
      display: 'stepper',
      min: 1,
      max: MAX_PAGE_SIZE,
    }),
  },
  async run(context) {
    const { propsValue } = context;
    const auth: ConductorAuth = {
      secretKey: context.auth.props.secretKey,
      endUserId: context.auth.props.endUserId,
    };

    if (propsValue.limit && (propsValue.limit < 1 || propsValue.limit > MAX_PAGE_SIZE)) {
      throw new Error(`Max Results must be between 1 and ${MAX_PAGE_SIZE} — got ${propsValue.limit}.`);
    }

    const queryParams: Record<string, string> = {
      limit: String(propsValue.limit ?? MAX_PAGE_SIZE),
      ...spreadIfDefined('nameContains', propsValue.nameContains),
      ...spreadIfDefined('status', propsValue.status),
    };

    // Same two types, same fallback order, as resolveItemIdByName (common/items.ts) — this
    // action exists so a flow builder can find the exact name that lookup expects, instead of
    // typing one blind into Create Invoice's line items.
    const [serviceItems, nonInventoryItems] = await Promise.all([
      conductorClient.request<ConductorItemListResponse>({
        auth,
        method: HttpMethod.GET,
        resourceUri: '/quickbooks-desktop/service-items',
        queryParams,
      }),
      conductorClient.request<ConductorItemListResponse>({
        auth,
        method: HttpMethod.GET,
        resourceUri: '/quickbooks-desktop/non-inventory-items',
        queryParams,
      }),
    ]);

    const items = [
      ...serviceItems.data.map((item) => flattenItem({ item, itemType: 'service' })),
      ...nonInventoryItems.data.map((item) => flattenItem({ item, itemType: 'non_inventory' })),
    ];

    return {
      items,
      count: items.length,
      // True if either item type has more results beyond this call's limit — this action
      // doesn't paginate across the two merged types, so narrow the search instead (e.g. via
      // Name Contains) rather than expecting more pages.
      has_more: serviceItems.hasMore || nonInventoryItems.hasMore,
    };
  },
});
