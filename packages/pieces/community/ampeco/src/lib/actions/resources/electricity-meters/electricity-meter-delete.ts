import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const electricityMeterDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'electricityMeterDelete',
  displayName: 'Resources - Electricity Meters - Electricity Meter Delete',
  description: 'Delete an electricity meter. (Endpoint: DELETE /public-api/resources/electricity-meters/v1.0/{electricityMeter})',
  props: {
        
  electricityMeter: Property.Number({
    displayName: 'Electricity Meter',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-meters/v1.0/{electricityMeter}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
