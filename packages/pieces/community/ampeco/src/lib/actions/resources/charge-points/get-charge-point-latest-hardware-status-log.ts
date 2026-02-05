import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetChargePointLatestHardwareStatusLogResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/latest-hardware-status-log

export const getChargePointLatestHardwareStatusLogAction = createAction({
  auth: ampecoAuth,
  name: 'getChargePointLatestHardwareStatusLog',
  displayName: 'Resources - Charge Points - Get Charge Point Latest Hardware Status Log',
  description: 'Get the latest hardware status log entry for a charge point.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),
  },
  async run(context): Promise<GetChargePointLatestHardwareStatusLogResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/latest-hardware-status-log', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetChargePointLatestHardwareStatusLogResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
