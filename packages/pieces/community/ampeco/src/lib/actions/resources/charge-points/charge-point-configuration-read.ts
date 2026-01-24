import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import {
  handleApiError,
  makeAmpecoApiCall,
  prepareQueryParams,
  processPathParameters
} from '../../../common/utils';
import { ChargePointConfigurationReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/configurations/{key}
export const chargePointConfigurationReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointConfigurationRead',
  displayName: 'Resources - Charge Points - Charge Point Configuration Read',
  description: "Get a charge point's cached configuration for a single key.",
  props: {
    chargePoint: Property.Number({
      displayName: 'Charge Point',
      required: true,
    }),

    key: Property.ShortText({
      displayName: 'Key',
      required: true,
    }),
  },
  async run(context): Promise<ChargePointConfigurationReadResponse> {
    try {
      const url = processPathParameters(
        '/public-api/resources/charge-points/v2.0/{chargePoint}/configurations/{key}',
        context.propsValue
      );

      const queryParams = prepareQueryParams(context.propsValue, []);

      const body = undefined;

      return (await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      )) as ChargePointConfigurationReadResponse;
    } catch (error) {
      handleApiError(error);
    }
  },
});
