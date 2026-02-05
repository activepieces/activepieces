import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { CreatePaymentTerminalResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/payment-terminals/v1.0

export const createPaymentTerminalAction = createAction({
  auth: ampecoAuth,
  name: 'createPaymentTerminal',
  displayName: 'Resources - Payment Terminals - Create Payment Terminal',
  description: 'Create a new payment terminal.',
  props: {
        
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
  requestBody_VariantType: Property.StaticDropdown({
    displayName: 'Request Body Variant Type',
    description: 'Select the type of the variant',
    required: true,
    options: {
      options: [
      { label: 'Payter on CP', value: '1' },
      { label: 'Payter on Location', value: '2' }
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
  preauthorizeAmount: Property.Number({
    displayName: 'Preauthorize Amount',
    description: 'Provide a Pre-authorize amount when the terminal is linked to a single charger.',
    required: true,
  }),}, 
'2': {
  transactionTimeout: Property.Number({
    displayName: 'Transaction Timeout',
    description: 'Provide a transaction timeout when the terminal is linked to a Location.',
    required: true,
  }),}
        };

        const key = requestBody_VariantType as unknown as string;
        if (key in variantMap) {
           return variantMap[key as VariantKey];
        }
        return {};
     }
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
'9': {}, 
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
  async run(context): Promise<CreatePaymentTerminalResponse> {
    try {
      const url = processPathParameters('/public-api/resources/payment-terminals/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['requestBody_VariantType', 'requestBody_VariantType', 'preauthorizeAmount', 'transactionTimeout', 'networkStatus', 'phone', 'defaultLanguage', 'presentCardOnStopSession', 'info', 'serialNumber', 'externalId', 'terminalId', 'verificationCode', 'merchantAccount', 'adyenApiKey']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as CreatePaymentTerminalResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
