import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { TaxCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const taxCreateAction = createAction({
  auth: ampecoAuth,
  name: 'taxCreate',
  displayName: 'Resources - Taxes - Tax Create',
  description: 'Create new Tax. (Endpoint: POST /public-api/resources/taxes/v2.0)',
  props: {
        
  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: true,
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
    required: true,
  }),

  taxIdentificationNumberId: Property.Number({
    displayName: 'Tax Identification Number Id',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<TaxCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/taxes/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'displayName', 'percentage', 'taxIdentificationNumberId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as TaxCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
