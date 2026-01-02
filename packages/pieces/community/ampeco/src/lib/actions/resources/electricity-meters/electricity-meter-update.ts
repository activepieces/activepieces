import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ElectricityMeterUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const electricityMeterUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'electricityMeterUpdate',
  displayName: 'Resources - Electricity Meters - Electricity Meter Update',
  description: 'Update electricity meter. (Endpoint: PATCH /public-api/resources/electricity-meters/v1.0/{electricityMeter})',
  props: {
        
  electricityMeter: Property.Number({
    displayName: 'Electricity Meter',
    description: '',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: false,
  }),

  integrationId: Property.Number({
    displayName: 'Integration Id',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<ElectricityMeterUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-meters/v1.0/{electricityMeter}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'integrationId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as ElectricityMeterUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
