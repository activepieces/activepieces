import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ElectricityRateReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const electricityRateReadAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRateRead',
  displayName: 'Resources - Electricity Rates - Electricity Rate Read',
  description: 'Get a single Electricity rate. (Endpoint: GET /public-api/resources/electricity-rates/v2.0/{electricityRate})',
  props: {
        
  electricityRate: Property.Number({
    displayName: 'Electricity Rate',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ElectricityRateReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0/{electricityRate}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ElectricityRateReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
