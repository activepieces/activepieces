import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ElectricityMeterUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/electricity-meters/v1.0/{electricityMeter}

export const electricityMeterUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'electricityMeterUpdate',
  displayName: 'Resources - Electricity Meters - Update',
  description: 'Update electricity meter.',
  props: {
        
  electricityMeter: Property.Number({
    displayName: 'Electricity Meter',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    required: false,
  }),

  integrationId: Property.Number({
    displayName: 'Integration Id',
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
