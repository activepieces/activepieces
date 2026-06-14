import { createAction, Property } from '@activepieces/pieces-framework';
import { wayfrontAuth } from '../auth';
import {
  flattenOrder,
  wayfrontApiClient,
  WayfrontAuthType,
  WayfrontIndexOrder,
  WayfrontListResponse,
} from '../common';

export const listOrdersAction = createAction({
  auth: wayfrontAuth,
  name: 'list_orders',
  displayName: 'List Orders',
  description: 'Returns a list of orders from your Wayfront workspace, sorted by most recent first.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves a page of orders from the Wayfront workspace, newest first, with configurable page size and page number for pagination. Use to browse, scan, or look up recent orders. Read-only and idempotent: it returns current data without modifying anything.',
    idempotent: true,
  },
  props: {
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum number of orders to return per page. Defaults to 20.',
      required: false,
      defaultValue: 20,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to retrieve when results span multiple pages. Starts at 1.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const auth = context.auth as unknown as WayfrontAuthType;
    const p = context.propsValue;

    const response = await wayfrontApiClient(auth.workspaceUrl, auth.apiToken).get<
      WayfrontListResponse<WayfrontIndexOrder>
    >('/orders', {
      limit: String(p.limit ?? 20),
      page: String(p.page ?? 1),
    });

    return response.body.data.map(flattenOrder);
  },
});
