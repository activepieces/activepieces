import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pargoAuth } from '../auth';
import { pargoRequest } from '../common/client';

export const listPickupPointsAction = createAction({
  auth: pargoAuth,
  name: 'list_pickup_points',
  displayName: 'List Pickup Points',
  description: 'List available Pargo pickup points, optionally filtered by postal code.',
  props: {
    postal_code: Property.ShortText({
      displayName: 'Postal Code',
      description: 'Optional — filter points by postal code.',
      required: false,
    }),
    limit: Property.Number({
      displayName: 'Limit',
      required: false,
      defaultValue: 50,
    }),
  },
  async run({ auth, propsValue }) {
    const query: Record<string, string | number> = {
      limit: propsValue.limit ?? 50,
    };
    if (propsValue.postal_code) {
      query['postal_code'] = propsValue.postal_code;
    }
    return pargoRequest<Record<string, unknown>>({
      auth: auth.props,
      method: HttpMethod.GET,
      path: '/pickup-points',
      query,
    });
  },
});
