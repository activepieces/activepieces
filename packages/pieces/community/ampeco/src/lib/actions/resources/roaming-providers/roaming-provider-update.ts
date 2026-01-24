import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { RoamingProviderUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/roaming-providers/v2.0/{roamingProvider}

export const roamingProviderUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'roamingProviderUpdate',
  displayName: 'Resources - Roaming Providers - Update',
  description: 'Update Roaming Providers.',
  props: {
        
  roamingProvider: Property.Number({
    displayName: 'Roaming Provider',
    description: '',
    required: true,
  }),

  requestBody_VariantType: Property.StaticDropdown({
    displayName: 'Request Body Variant Type',
    description: 'Select the type of the variant',
    required: true,
    options: {
      options: [
      { label: 'Hubject', value: '1' },
      { label: 'OCPI or Gireve 2.2.1', value: '2' }
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
  hubjectId: Property.ShortText({
    displayName: 'Hubject Id',
    description: '',
    required: false,
  }),}, 
'2': {
  countryCode: Property.ShortText({
    displayName: 'Country Code',
    description: 'The code provided during the token exchange process.',
    required: false,
  }),

  partyId: Property.ShortText({
    displayName: 'Party Id',
    description: 'ID of the Operator or Provider of roaming.',
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
  async run(context): Promise<RoamingProviderUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-providers/v2.0/{roamingProvider}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['requestBody_VariantType', 'hubjectId', 'countryCode', 'partyId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as RoamingProviderUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
