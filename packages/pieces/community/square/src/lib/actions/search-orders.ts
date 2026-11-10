import { createAction, Property } from '@activepieces/pieces-framework';
import { squareAuth } from '../auth';
import { squareInputs } from '../common/inputs';
import { squareOps } from '../common/operations';
import { squareProps } from '../common/props';
import { squareOutputSchemas } from '../output-schemas';

export const searchOrdersAction = createAction({
  name: 'search_orders',
  classification: 'SEARCH',
  auth: squareAuth,
  displayName: 'Search Orders',
  description: 'Finds orders by location, state, customer and creation date, newest first.',
  audience: 'human',
  aiMetadata: {
    description: 'Searches Square orders with filters picked from lists; agents use Search Orders (by ID). Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    location_id: squareProps.location({ required: false, description: 'Leave empty to search all active locations (up to 10).' }),
    states: orderStatesProp(),
    customer_id: squareProps.customer({ required: false }),
    created_after: Property.DateTime({ displayName: 'Created After', required: false }),
    created_before: Property.DateTime({ displayName: 'Created Before', required: false }),
    limit: squareProps.limitProp({ max: 500, fallback: 50 }),
    cursor: squareProps.cursorProp(),
  },
  outputSchema: squareOutputSchemas.orders,
  async run(context) {
    const p = context.propsValue;
    const locationId = squareInputs.optionalId({ value: p.location_id, label: 'Location' });
    const customerId = squareInputs.optionalId({ value: p.customer_id, label: 'Customer' });
    return squareOps.searchOrders({
      auth: context.auth,
      locationIds: locationId ? [locationId] : [],
      states: Array.isArray(p.states) ? p.states.filter((s): s is string => typeof s === 'string') : [],
      createdAfter: squareInputs.dateTime({ value: p.created_after, label: 'Created After' }),
      createdBefore: squareInputs.dateTime({ value: p.created_before, label: 'Created Before' }),
      customerIds: customerId ? [customerId] : [],
      limit: squareInputs.limit({ value: p.limit, fallback: 50, max: 500 }),
      cursor: squareInputs.cursor(p.cursor),
    });
  },
});

function orderStatesProp() {
  return Property.StaticMultiSelectDropdown({
    displayName: 'States',
    description: 'Leave empty for all states.',
    required: false,
    options: {
      options: [
        { label: 'Open', value: 'OPEN' },
        { label: 'Completed', value: 'COMPLETED' },
        { label: 'Canceled', value: 'CANCELED' },
        { label: 'Draft', value: 'DRAFT' },
      ],
    },
  });
}

export const orderStatesSelect = orderStatesProp;
