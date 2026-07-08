import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { UpdateConfigurationTemplateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/configuration-templates/v1.0/{template}

export const updateConfigurationTemplateAction = createAction({
  auth: ampecoAuth,
  name: 'updateConfigurationTemplate',
  displayName: 'Resources - Configuration Templates - Update Configuration Template',
  description: 'Update Configuration Template.',
  audience: 'both',
  aiMetadata: { description: 'Update an existing OCPP configuration template (currently its name) identified by its numeric id. Not idempotent in general since it mutates live state; use to rename a template. To change the variables within a template, use the Configuration Template Variable actions instead.', idempotent: false },
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
