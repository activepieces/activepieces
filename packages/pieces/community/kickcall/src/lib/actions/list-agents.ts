import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { kickcallAuth } from '../auth';
import { kickcallClient } from '../common/client';
import { kickcallNumbers } from '../common/numbers';
import { locationIdDropdown } from '../common/props';

export const listAgentsAction = createAction({
  auth: kickcallAuth,
  name: 'list_agents',
  displayName: 'List Agents',
  description: 'Returns Kickcall agents for a location.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists AI agents configured for a Kickcall location. Supports page pagination. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    location_id: locationIdDropdown,
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number to fetch (starts at 1).',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const page = kickcallNumbers.parsePositiveInteger({
      value: propsValue.page,
      fallback: 1,
      fieldName: 'Page',
    });
    return kickcallClient.bearerRequest({
      auth,
      method: HttpMethod.GET,
      path: `/api/v1/business/locations/${encodeURIComponent(propsValue.location_id)}/agents`,
      queryParams: {
        page: String(page),
      },
    });
  },
});
