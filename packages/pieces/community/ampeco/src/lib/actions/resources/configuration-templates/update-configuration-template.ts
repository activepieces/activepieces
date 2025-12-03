import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { UpdateConfigurationTemplateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const updateConfigurationTemplateAction = createAction({
  auth: ampecoAuth,
  name: 'updateConfigurationTemplate',
  displayName: 'Resources - Configuration Templates - Update Configuration Template',
  description: 'Update Configuration Template. (Endpoint: PATCH /public-api/resources/configuration-templates/v1.0/{template})',
  props: {
        
  template: Property.Number({
    displayName: 'Template',
    description: '',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<UpdateConfigurationTemplateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/configuration-templates/v1.0/{template}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as UpdateConfigurationTemplateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
