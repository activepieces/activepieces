import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ConfigurationTemplateVariableUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/configuration-templates/v1.0/{template}/variables/{variable}

export const configurationTemplateVariableUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'configurationTemplateVariableUpdate',
  displayName: 'Resources - Configuration Templates - Configuration Template Variable Update',
  description: 'Update a Configuration Template Variable.',
  props: {
        
  template: Property.Number({
    displayName: 'Template',
    required: true,
  }),

  variable: Property.Number({
    displayName: 'Variable',
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
     required: true,
     auth:ampecoAuth,
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
    required: false,
  }),

  value: Property.ShortText({
    displayName: 'Value',
    description: '',
    required: false,
  }),}, 
'2': {
  value: Property.ShortText({
    displayName: 'Value',
    description: '',
    required: false,
  }),

  variableName: Property.ShortText({
    displayName: 'Variable Name',
    description: '',
    required: false,
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
    required: false,
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
  async run(context): Promise<ConfigurationTemplateVariableUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/configuration-templates/v1.0/{template}/variables/{variable}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['requestBody_VariantType', 'keyName', 'value', 'variableName', 'variableType', 'variableInstance', 'component', 'componentInstance', 'evseId', 'connectorId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as ConfigurationTemplateVariableUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
