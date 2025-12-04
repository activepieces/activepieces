import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const configurationTemplateBulkCreateVariablesAction = createAction({
  auth: ampecoAuth,
  name: 'configurationTemplateBulkCreateVariables',
  displayName: 'Actions - Configuration Template - Configuration Template Bulk Create Variables',
  description: 'Create multiple variables for a specific configuration template, adds them to the already existing keys and validates if there are duplicates. (Endpoint: POST /public-api/actions/configuration-template/v1.0/{template}/insert-bulk-variables)',
  props: {
        
  template: Property.Number({
    displayName: 'Template',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/configuration-template/v1.0/{template}/insert-bulk-variables', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        []
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
