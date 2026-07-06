import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetRoamingConnectionResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/roaming-connections/v2.0/{roamingConnection}

export const getRoamingConnectionAction = createAction({
  auth: ampecoAuth,
  name: 'getRoamingConnection',
  displayName: 'Resources - Roaming Connections - Get Roaming Connection',
  description: 'Get a Roaming Connections.',
  audience: 'both',
  aiMetadata: { description: 'Fetch a single roaming connection by its numeric ID. Read-only and safe to repeat. To enumerate all roaming connections use list-roaming-connections instead.', idempotent: true },
  props: {
        
  roamingConnection: Property.Number({
    displayName: 'Roaming Connection',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<GetRoamingConnectionResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-connections/v2.0/{roamingConnection}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetRoamingConnectionResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
