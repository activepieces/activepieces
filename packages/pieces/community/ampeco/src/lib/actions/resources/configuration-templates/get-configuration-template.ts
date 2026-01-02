import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { GetConfigurationTemplateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const getConfigurationTemplateAction = createAction({
  auth: ampecoAuth,
  name: 'getConfigurationTemplate',
  displayName: 'Resources - Configuration Templates - Get Configuration Template',
  description: 'Get Configuration Template. (Endpoint: GET /public-api/resources/configuration-templates/v1.0/{template})',
  props: {
        
  template: Property.Number({
    displayName: 'Template',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<GetConfigurationTemplateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/configuration-templates/v1.0/{template}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetConfigurationTemplateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
