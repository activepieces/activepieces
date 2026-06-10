import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetChargePointLatestNetworkStatusLogResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const getChargePointLatestNetworkStatusLogAction = createAction({
  auth: ampecoAuth,
  name: 'getChargePointLatestNetworkStatusLog',
  displayName: 'Resources - Charge Points - Get Charge Point Latest Network Status Log',
  description: 'Get the latest network status log entry for a charge point.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<GetChargePointLatestNetworkStatusLogResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/latest-network-status-log', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetChargePointLatestNetworkStatusLogResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
