import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../../auth';
import { squareInputs } from '../../common/inputs';
import { squareOps } from '../../common/operations';
import { squareProps } from '../../common/props';
import { squareOutputSchemas } from '../../output-schemas';
import { orderStatesSelect } from '../search-orders';

export const searchOrdersByIdAction = createAction({
  name: 'search_orders_by_id',
  classification: 'SEARCH',
  auth: squareAuth,
  displayName: 'Search Orders (by ID)',
  description: 'Finds orders by location IDs, state, customer ID and creation date.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Searches Square orders newest first and returns one page with totals and line items. Filter by up to 10 location IDs (empty = all active locations), states (OPEN, COMPLETED, CANCELED, DRAFT), customer IDs and a created-at range (ISO 8601). Use Next Cursor within about 5 minutes for more. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    location_ids: Property.Array({ displayName: 'Location IDs', description: 'Up to 10. Leave empty for all active locations.', required: false }),
    states: orderStatesSelect(),
    customer_ids: Property.Array({ displayName: 'Customer IDs', required: false }),
    created_after: Property.DateTime({ displayName: 'Created After', required: false }),
    created_before: Property.DateTime({ displayName: 'Created Before', required: false }),
    limit: squareProps.limitProp({ max: 500, fallback: 50 }),
    cursor: squareProps.cursorProp(),
  },
  outputSchema: squareOutputSchemas.orders,
  async run(context) {
    const p = context.propsValue;
    return squareOps.searchOrders({
      auth: context.auth,
      locationIds: squareInputs.idList({ value: p.location_ids, label: 'Location IDs', max: 10 }),
      states: Array.isArray(p.states) ? p.states.filter((s): s is string => typeof s === 'string') : [],
      createdAfter: squareInputs.dateTime({ value: p.created_after, label: 'Created After' }),
      createdBefore: squareInputs.dateTime({ value: p.created_before, label: 'Created Before' }),
      customerIds: squareInputs.idList({ value: p.customer_ids, label: 'Customer IDs', max: 10 }),
      limit: squareInputs.limit({ value: p.limit, fallback: 50, max: 500 }),
      cursor: squareInputs.cursor(p.cursor),
    });
  },
});
