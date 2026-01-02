import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const configurationTemplateVariableDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'configurationTemplateVariableDelete',
  displayName: 'Resources - Configuration Templates - Configuration Template Variable Delete',
  description: 'Delete a Configuration Template Variable. (Endpoint: DELETE /public-api/resources/configuration-templates/v1.0/{template}/variables/{variable})',
  props: {
        
  template: Property.Number({
    displayName: 'Template',
    description: '',
    required: true,
  }),

  variable: Property.Number({
    displayName: 'Variable',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/configuration-templates/v1.0/{template}/variables/{variable}', context.propsValue);
      
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
