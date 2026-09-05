import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { kickcallAuth } from '../auth';
import { kickcallClient } from '../common/client';

export const listLocationsAction = createAction({
  auth: kickcallAuth,
  name: 'list_locations',
  displayName: 'List Locations',
  description: 'Returns Kickcall locations available to the connected API key.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists business locations accessible with the connected Kickcall API key. Supports page pagination. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to fetch (starts at 1).',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const page =
      typeof propsValue.page === 'number' && propsValue.page >= 1
        ? Math.floor(propsValue.page)
        : 1;
    return kickcallClient.bearerRequest({
      auth,
      method: HttpMethod.GET,
      path: '/api/v1/business/locations',
      queryParams: {
        page: String(page),
      },
    });
  },
});
