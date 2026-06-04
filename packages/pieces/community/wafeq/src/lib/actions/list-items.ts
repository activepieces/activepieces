import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { wafeqAuth } from '../common/auth';
import { wafeqApiCall, WafeqPaginatedResponse } from '../common/client';
import { wafeqHelpers } from '../common/helpers';

export const listItems = createAction({
  auth: wafeqAuth,
  name: 'list_items',
  displayName: 'List Items',
  description:
    'List products and services from your Wafeq catalog. Useful for syncing your catalog to a spreadsheet or another system.',
  props: {
    external_id: Property.ShortText({
      displayName: 'Your Reference ID (optional)',
      description:
        'Find a single item by the reference ID you stored when creating it (e.g. your Shopify product ID).',
      required: false,
    }),
    created_after: Property.DateTime({
      displayName: 'Created On or After',
      description: 'Only return items created on or after this date.',
      required: false,
    }),
    created_before: Property.DateTime({
      displayName: 'Created On or Before',
      description: 'Only return items created on or before this date.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Max Results',
      description: 'How many items to return at most. Default is 50, maximum is 200.',
      required: false,
      defaultValue: 50,
    }),
  },
  async run(context) {
    const p = context.propsValue;
    const queryParams = wafeqHelpers.stripEmpty({
      external_id: p.external_id,
      created_ts_after: p.created_after,
      created_ts_before: p.created_before,
      page_size: String(Math.min(Math.max(p.limit ?? 50, 1), 200)),
    }) as Record<string, string>;
    const response = await wafeqApiCall<WafeqPaginatedResponse<ListedItem>>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: '/items/',
      queryParams,
    });
    return {
      total: response.body.count,
      returned: response.body.results.length,
      results: response.body.results.map((i) => ({
        id: i.id,
        name: i.name,
        description: i.description ?? null,
        sku: i.sku ?? null,
        unit_price: i.unit_price ?? null,
        unit_cost: i.unit_cost ?? null,
        is_tracked_inventory: i.is_tracked_inventory ?? null,
        is_active: i.is_active ?? null,
        external_id: i.external_id ?? null,
        created_ts: i.created_ts ?? null,
        modified_ts: i.modified_ts ?? null,
      })),
    };
  },
});

type ListedItem = {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  unit_price?: number;
  unit_cost?: number;
  is_tracked_inventory?: boolean;
  is_active?: boolean;
  external_id?: string;
  created_ts?: string;
  modified_ts?: string;
};
