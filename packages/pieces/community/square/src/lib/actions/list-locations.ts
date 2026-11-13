import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { squareAuth } from '../auth';
import { squareClient } from '../common/client';
import { squareShape } from '../common/shape';
import { squareOutputSchemas } from '../output-schemas';

export const listLocationsAction = createAction({
  name: 'list_locations',
  classification: 'SEARCH',
  auth: squareAuth,
  displayName: 'List Locations',
  description: 'Lists the business locations (stores) of the Square account.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists the seller locations with their IDs, currency, time zone and address. Location IDs are needed by orders, payment links and inventory; "main" is also accepted wherever a location ID is optional. Read-only and safe to retry.',
    idempotent: true,
  },
  props: {
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Which locations to return.',
      required: false,
      defaultValue: 'ACTIVE',
      options: {
        options: [
          { label: 'Active only', value: 'ACTIVE' },
          { label: 'Inactive only', value: 'INACTIVE' },
          { label: 'All', value: 'ALL' },
        ],
      },
    }),
  },
  outputSchema: squareOutputSchemas.locations,
  async run(context) {
    const status = context.propsValue.status ?? 'ACTIVE';
    const body = await squareClient.request<unknown>({ auth: context.auth, method: HttpMethod.GET, path: ['v2', 'locations'], operation: 'list locations' });
    const items = squareShape
      .list({ value: body, key: 'locations' })
      .map(squareShape.location)
      .filter((location) => status === 'ALL' || location.status === status);
    return squareShape.page({ items, cursor: null });
  },
});
