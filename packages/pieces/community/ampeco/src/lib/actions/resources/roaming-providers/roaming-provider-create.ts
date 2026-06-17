import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { RoamingProviderCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/roaming-providers/v2.0

export const roamingProviderCreateAction = createAction({
  auth: ampecoAuth,
  name: 'roamingProviderCreate',
  displayName: 'Resources - Roaming Providers - Create',
  description: 'Create new Roaming Provider **Only applicable for Hubject, Gireve 2.2.1 and OCPI with missing credentials module emsp roaming connections**.',
  audience: 'both',
  aiMetadata: { description: 'Create a new AMPECO roaming provider for an EMSP roaming connection. Only applicable for Hubject, Gireve 2.2.1, and OCPI connections with a missing credentials module; choose the matching variant (Hubject or OCPI/Gireve 2.2.1) and supply business name and platform ID. Not idempotent: each call creates a separate provider. To modify an existing provider, use the roaming provider update action.', idempotent: false },
  props: {
        
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
  businessName: Property.ShortText({
    displayName: 'Business Name',
    description: '',
    required: false,
  }),

  platformId: Property.Number({
    displayName: 'Platform Id',
    description: '',
    required: true,
  }),

  partnerId: Property.Number({
    displayName: 'Partner Id',
    description: '',
    required: false,
  }),}, 
'2': {
  businessName: Property.ShortText({
    displayName: 'Business Name',
    description: '',
    required: false,
  }),

  platformId: Property.Number({
    displayName: 'Platform Id',
    description: '',
    required: true,
  }),

  partnerId: Property.Number({
    displayName: 'Partner Id',
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
  async run(context): Promise<RoamingProviderCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/roaming-providers/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['requestBody_VariantType', 'businessName', 'platformId', 'partnerId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as RoamingProviderCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
