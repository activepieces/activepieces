import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ElectricityMeterCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const electricityMeterCreateAction = createAction({
  auth: ampecoAuth,
  name: 'electricityMeterCreate',
  displayName: 'Resources - Electricity Meters - Electricity Meter Create',
  description: 'Create a new electricity meter. (Endpoint: POST /public-api/resources/electricity-meters/v1.0)',
  props: {
        
  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: true,
  }),

  integrationId: Property.Number({
    displayName: 'Integration Id',
    description: '',
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
