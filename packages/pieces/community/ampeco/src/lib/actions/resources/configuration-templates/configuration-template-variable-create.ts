import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ConfigurationTemplateVariableCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/configuration-templates/v1.0/{template}/variables

export const configurationTemplateVariableCreateAction = createAction({
  auth: ampecoAuth,
  name: 'configurationTemplateVariableCreate',
  displayName: 'Resources - Configuration Templates - Configuration Template Variable Create',
  description: 'Create a new Configuration Template Variable.',
  props: {
        
  template: Property.Number({
    displayName: 'Template',
    required: true,
  }),

  requestBody_VariantType: Property.StaticDropdown({
    displayName: 'Request Body Variant Type',
    description: 'Select the type of the variant',
    required: true,
    options: {
      options: [
      { label: 'Configuration variable for OCPP 1.6', value: '1' },
      { label: 'Configuration variable for OCPP 2.0.1', value: '2' }
      ],
    },
  }),

  requestBody: Property.DynamicProperties({
     displayName: 'Request Body',
     auth:ampecoAuth,
     required: true,
     refreshers: ['requestBody_VariantType'],
     props: async ({ requestBody_VariantType }) => {
        if (!requestBody_VariantType) {
           return {};
        }

        type VariantKey = '1' | '2';

        const variantMap = {
          '1': {
  keyName: Property.ShortText({
    displayName: 'Key Name',
    description: '',
    required: true,
  }),

  value: Property.ShortText({
    displayName: 'Value',
    description: '',
    required: true,
  }),}, 
'2': {
  value: Property.ShortText({
    displayName: 'Value',
    description: '',
    required: true,
  }),

  variableName: Property.ShortText({
    displayName: 'Variable Name',
    description: '',
    required: true,
  }),

  variableType: Property.StaticDropdown({
    displayName: 'Variable Type',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'Actual', value: 'Actual' },
      { label: 'Target', value: 'Target' },
      { label: 'MinSet', value: 'MinSet' },
      { label: 'MaxSet', value: 'MaxSet' }
      ],
    },
  }),

  variableInstance: Property.ShortText({
    displayName: 'Variable Instance',
    description: '',
    required: false,
  }),

  component: Property.ShortText({
    displayName: 'Component',
    description: '',
    required: true,
  }),

  componentInstance: Property.ShortText({
    displayName: 'Component Instance',
    description: '',
    required: false,
  }),

  evseId: Property.Number({
    displayName: 'Evse Id',
    description: '',
    required: false,
  }),

  connectorId: Property.Number({
    displayName: 'Connector Id',
    description: '',
    required: false,
  }),}
        };

        const key = requestBody_VariantType as unknown as string;
        if (key in variantMap) {
           return variantMap[key as VariantKey];
        }
        return {};
     }
  }),
  },
  async run(context): Promise<ConfigurationTemplateVariableCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/configuration-templates/v1.0/{template}/variables', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['requestBody_VariantType', 'keyName', 'value', 'variableName', 'variableType', 'variableInstance', 'component', 'componentInstance', 'evseId', 'connectorId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ConfigurationTemplateVariableCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
