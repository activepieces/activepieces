import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { UpdatePaymentTerminalResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/payment-terminals/v1.0/{paymentTerminal}

export const updatePaymentTerminalAction = createAction({
  auth: ampecoAuth,
  name: 'updatePaymentTerminal',
  displayName: 'Resources - Payment Terminals - Update Payment Terminal',
  description: 'Update Payment terminal.',
  props: {
        
  paymentTerminal: Property.ShortText({
    displayName: 'Payment Terminal',
    description: '',
    required: true,
  }),

  requestBody_VariantType: Property.StaticDropdown({
    displayName: 'Request Body Variant Type',
    description: 'Select the type of the variant',
    required: true,
    options: {
      options: [
      { label: 'Payter', value: '1' },
      { label: 'Valina', value: '2' },
      { label: 'Crane', value: '3' },
      { label: 'Ampeco', value: '4' },
      { label: 'Nayax', value: '5' },
      { label: 'Embedded', value: '6' },
      { label: 'Pax', value: '7' },
      { label: 'Windcave', value: '8' },
      { label: 'Web portal', value: '9' },
      { label: 'AdyenCastles', value: '10' }
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

        type VariantKey = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10';

        const variantMap = {
          '1': {
  requestBody: Property.ShortText({
    displayName: 'Request Body',
    description: '',
    required: false,
  }),}, 
'2': {
  networkStatus: Property.StaticDropdown({
    displayName: 'Network Status',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'online', value: 'online' },
      { label: 'offline', value: 'offline' },
      { label: 'unknown', value: 'unknown' }
      ],
    },
  }),

  phone: Property.ShortText({
    displayName: 'Phone',
    description: '',
    required: false,
  }),

  defaultLanguage: Property.ShortText({
    displayName: 'Default Language',
    description: '',
    required: false,
  }),

  presentCardOnStopSession: Property.StaticDropdown({
    displayName: 'Present Card On Stop Session',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  info: Property.Array({
    displayName: 'Info',
    description: '',
    required: false,
    properties: { 
         
  locale: Property.ShortText({
    displayName: 'Locale',
    description: 'valid locale.',
    required: false,
  }),

  translation: Property.ShortText({
    displayName: 'Translation',
    description: '',
    required: false,
  }), 
    },
  }),

  serialNumber: Property.ShortText({
    displayName: 'Serial Number',
    description: '',
    required: false,
  }),

  externalId: Property.ShortText({
    displayName: 'External Id',
    description: '',
    required: false,
  }),}, 
'3': {
  serialNumber: Property.ShortText({
    displayName: 'Serial Number',
    description: '',
    required: false,
  }),

  externalId: Property.ShortText({
    displayName: 'External Id',
    description: '',
    required: false,
  }),}, 
'4': {
  webhookUrl: Property.ShortText({
    displayName: 'Webhook Url',
    description: '',
    required: false,
  }),

  serialNumber: Property.ShortText({
    displayName: 'Serial Number',
    description: '',
    required: false,
  }),

  externalId: Property.ShortText({
    displayName: 'External Id',
    description: '',
    required: false,
  }),}, 
'5': {
  terminalId: Property.ShortText({
    displayName: 'Terminal Id',
    description: 'This is the Device Number of the relevant Nayax terminal that is set up in the Nayax system. Please be careful to add the correct Device number on the relevant terminal.',
    required: false,
  }),

  serialNumber: Property.ShortText({
    displayName: 'Serial Number',
    description: '',
    required: false,
  }),

  externalId: Property.ShortText({
    displayName: 'External Id',
    description: '',
    required: false,
  }),}, 
'6': {
  serialNumber: Property.ShortText({
    displayName: 'Serial Number',
    description: '',
    required: false,
  }),

  externalId: Property.ShortText({
    displayName: 'External Id',
    description: '',
    required: false,
  }),}, 
'7': {
  verificationCode: Property.ShortText({
    displayName: 'Verification Code',
    description: '',
    required: false,
  }),

  defaultLanguage: Property.ShortText({
    displayName: 'Default Language',
    description: '',
    required: false,
  }),

  presentCardOnStopSession: Property.StaticDropdown({
    displayName: 'Present Card On Stop Session',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  info: Property.Array({
    displayName: 'Info',
    description: '',
    required: false,
    properties: { 
         
  locale: Property.ShortText({
    displayName: 'Locale',
    description: 'valid locale.',
    required: false,
  }),

  translation: Property.ShortText({
    displayName: 'Translation',
    description: '',
    required: false,
  }), 
    },
  }),

  serialNumber: Property.ShortText({
    displayName: 'Serial Number',
    description: '',
    required: false,
  }),

  externalId: Property.ShortText({
    displayName: 'External Id',
    description: '',
    required: false,
  }),}, 
'8': {
  serialNumber: Property.ShortText({
    displayName: 'Serial Number',
    description: '',
    required: false,
  }),

  externalId: Property.ShortText({
    displayName: 'External Id',
    description: '',
    required: false,
  }),}, 
'9': {
  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: false,
  }),

  integrationId: Property.Number({
    displayName: 'Integration Id',
    description: '',
    required: false,
  }),

  terminalType: Property.StaticDropdown({
    displayName: 'Terminal Type',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'Payter', value: 'Payter' },
      { label: 'Valina', value: 'Valina' },
      { label: 'Crane', value: 'Crane' },
      { label: 'Ampeco', value: 'Ampeco' },
      { label: 'Nayax', value: 'Nayax' },
      { label: 'Embedded', value: 'Embedded' },
      { label: 'Pax', value: 'Pax' },
      { label: 'Windcave', value: 'Windcave' },
      { label: 'Web portal', value: 'Web portal' },
      { label: 'AdyenCastles', value: 'AdyenCastles' }
      ],
    },
  }),

  operatorId: Property.Number({
    displayName: 'Operator Id',
    description: '',
    required: false,
  }),}, 
'10': {
  networkStatus: Property.StaticDropdown({
    displayName: 'Network Status',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'online', value: 'online' },
      { label: 'offline', value: 'offline' },
      { label: 'unknown', value: 'unknown' }
      ],
    },
  }),

  phone: Property.ShortText({
    displayName: 'Phone',
    description: '',
    required: false,
  }),

  defaultLanguage: Property.ShortText({
    displayName: 'Default Language',
    description: '',
    required: false,
  }),

  presentCardOnStopSession: Property.StaticDropdown({
    displayName: 'Present Card On Stop Session',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  info: Property.Array({
    displayName: 'Info',
    description: '',
    required: false,
    properties: { 
         
  locale: Property.ShortText({
    displayName: 'Locale',
    description: 'valid locale.',
    required: false,
  }),

  translation: Property.ShortText({
    displayName: 'Translation',
    description: '',
    required: false,
  }), 
    },
  }),

  serialNumber: Property.ShortText({
    displayName: 'Serial Number',
    description: '',
    required: false,
  }),

  externalId: Property.ShortText({
    displayName: 'External Id',
    description: '',
    required: false,
  }),

  merchantAccount: Property.ShortText({
    displayName: 'Merchant Account',
    description: 'Unique identifier of the merchant in Adyen\'s portal.',
    required: false,
  }),

  adyenApiKey: Property.ShortText({
    displayName: 'Adyen Api Key',
    description: 'API key to authenticate requests to Adyen.',
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
  async run(context): Promise<UpdatePaymentTerminalResponse> {
    try {
      const url = processPathParameters('/public-api/resources/payment-terminals/v1.0/{paymentTerminal}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['requestBody_VariantType', 'networkStatus', 'phone', 'defaultLanguage', 'presentCardOnStopSession', 'info', 'serialNumber', 'externalId', 'webhookUrl', 'terminalId', 'verificationCode', 'name', 'integrationId', 'terminalType', 'operatorId', 'merchantAccount', 'adyenApiKey']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as UpdatePaymentTerminalResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
