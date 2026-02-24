import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ElectricityMeterCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/electricity-meters/v1.0

export const electricityMeterCreateAction = createAction({
  auth: ampecoAuth,
  name: 'electricityMeterCreate',
  displayName: 'Resources - Electricity Meters - Create',
  description: 'Create a new electricity meter.',
  props: {
        
  name: Property.ShortText({
    displayName: 'Name',
    required: true,
  }),

  integrationId: Property.Number({
    displayName: 'Integration Id',
    required: true,
  }),
  },
  async run(context): Promise<ElectricityMeterCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-meters/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'integrationId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ElectricityMeterCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
