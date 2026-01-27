import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetEvseLatestHardwareStatusLogResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/evses/v2.0/{evse}/latest-hardware-status-log

export const getEvseLatestHardwareStatusLogAction = createAction({
  auth: ampecoAuth,
  name: 'getEvseLatestHardwareStatusLog',
  displayName: 'Resources - Evses - Get Evse Latest Hardware Status Log',
  description: 'Get the latest hardware status log entry for an EVSE.',
  props: {
        
  evse: Property.Number({
    displayName: 'Evse',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<GetEvseLatestHardwareStatusLogResponse> {
    try {
      const url = processPathParameters('/public-api/resources/evses/v2.0/{evse}/latest-hardware-status-log', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetEvseLatestHardwareStatusLogResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
