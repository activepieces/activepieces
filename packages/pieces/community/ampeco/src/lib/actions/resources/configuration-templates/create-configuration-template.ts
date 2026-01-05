import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { CreateConfigurationTemplateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/configuration-templates/v1.0

export const createConfigurationTemplateAction = createAction({
  auth: ampecoAuth,
  name: 'createConfigurationTemplate',
  displayName: 'Resources - Configuration Templates - Create Configuration Template',
  description: 'Create new Configuration Template.',
  props: {
        
  name: Property.ShortText({
    displayName: 'Name',
    required: true,
  }),

  ocppVersion: Property.StaticDropdown({
    displayName: 'Ocpp Version',
    required: true,
    options: {
      options: [
      { label: 'ocpp 1.6', value: 'ocpp 1.6' },
      { label: 'ocpp 2.0.1', value: 'ocpp 2.0.1' }
      ],
    },
  }),
  },
  async run(context): Promise<CreateConfigurationTemplateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/configuration-templates/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'ocppVersion']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as CreateConfigurationTemplateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
