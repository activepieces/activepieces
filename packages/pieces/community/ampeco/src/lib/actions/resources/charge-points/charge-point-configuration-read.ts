import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointConfigurationReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointConfigurationReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointConfigurationRead',
  displayName: 'Resources - Charge Points - Charge Point Configuration Read',
  description: 'Get a charge point&#x27;s cached configuration for a single key. (Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/configurations/{key})',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  key: Property.ShortText({
    displayName: 'Key',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointConfigurationReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/configurations/{key}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointConfigurationReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
