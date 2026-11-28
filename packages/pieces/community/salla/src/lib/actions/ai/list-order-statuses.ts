import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sallaUtils } from '../../common/helpers';
import { sallaAuth } from '../../auth';
import { sallaApi } from '../../common/client';
import { sallaOutputSchemas } from '../../common/output-schemas';

export const aiListOrderStatusesAction = createAction({
  auth: sallaAuth,
  name: 'ai_list_order_statuses',
  classification: 'SEARCH',
  displayName: 'List Order Statuses',
  description: 'Lists the order statuses of the store, built-in and custom.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists every order status of the Salla store, built-in (type original, with a slug such as shipped) and the merchant\'s custom sub-statuses (type custom, with a parent), each with its numeric id. Call it first to get the status IDs that List Orders filters by and that Update Order Status needs for custom statuses. Names come back in the connection language (Arabic by default).',
    idempotent: true,
  },
  outputSchema: sallaOutputSchemas.orderStatuses,
  props: {},
  async run({ auth }) {
    const response = await sallaApi.request<unknown>({ auth, method: HttpMethod.GET, path: '/orders/statuses' });
    const data = response.body.data;
    const statuses = (Array.isArray(data) ? data : [])
      .filter(sallaApi.isRecord)
      .map((record) => sallaUtils.withKeys({ record, keys: STATUS_KEYS }));
    return { statuses, count: statuses.length, truncated: false };
  },
});


const STATUS_KEYS = ['id', 'name', 'slug', 'type', 'is_active', 'message', 'sort', 'parent', 'original'];
