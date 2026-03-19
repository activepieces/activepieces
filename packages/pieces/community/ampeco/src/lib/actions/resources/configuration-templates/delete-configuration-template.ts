import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/configuration-templates/v1.0/{template}

export const deleteConfigurationTemplateAction = createAction({
  auth: ampecoAuth,
  name: 'deleteConfigurationTemplate',
  displayName: 'Resources - Configuration Templates - Delete Configuration Template',
  description: 'Delete Configuration Template.',
  props: {
        
  template: Property.Number({
    displayName: 'Template',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/configuration-templates/v1.0/{template}', context.propsValue);
      
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
