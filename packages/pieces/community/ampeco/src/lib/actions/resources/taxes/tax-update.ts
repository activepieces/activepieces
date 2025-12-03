import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { TaxUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const taxUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'taxUpdate',
  displayName: 'Resources - Taxes - Tax Update',
  description: 'Taxes. (Endpoint: PATCH /public-api/resources/taxes/v2.0/{tax})',
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
