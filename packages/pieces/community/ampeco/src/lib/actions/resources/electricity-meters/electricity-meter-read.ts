import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ElectricityMeterReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const electricityMeterReadAction = createAction({
  auth: ampecoAuth,
  name: 'electricityMeterRead',
  displayName: 'Resources - Electricity Meters - Electricity Meter Read',
  description: 'Get information for an electricity meter by ID. (Endpoint: GET /public-api/resources/electricity-meters/v1.0/{electricityMeter})',
  props: {
        
  electricityMeter: Property.Number({
    displayName: 'Electricity Meter',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ElectricityMeterReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-meters/v1.0/{electricityMeter}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ElectricityMeterReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
