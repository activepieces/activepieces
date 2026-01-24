import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { TaxUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/taxes/v2.0/{tax}
export const taxUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'taxUpdate',
  displayName: 'Resources - Taxes - Update',
  description: 'Update Taxes.',
  props: {
        
  tax: Property.Number({
    displayName: 'Tax',
    description: '',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: false,
  }),

  displayName: Property.Array({
    displayName: 'Display Name',
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

  percentage: Property.Number({
    displayName: 'Percentage',
    description: '',
    required: false,
  }),

  taxIdentificationNumberId: Property.Number({
    displayName: 'Tax Identification Number Id',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<TaxUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/taxes/v2.0/{tax}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'displayName', 'percentage', 'taxIdentificationNumberId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as TaxUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
