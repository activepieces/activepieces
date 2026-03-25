import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { UpdateCurrencyRateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/currency-rates/v1.0/{currencyRate}

export const updateCurrencyRateAction = createAction({
  auth: ampecoAuth,
  name: 'updateCurrencyRate',
  displayName: 'Resources - Currency Rates - Update',
  description: 'Update Currency Rate.',
  props: {
        
  currencyRate: Property.Number({
    displayName: 'Currency Rate',
    description: '',
    required: true,
  }),

  rate: Property.Number({
    displayName: 'Rate',
    description: 'The exchange rate from base to target currency',
    required: true,
  }),
  },
  async run(context): Promise<UpdateCurrencyRateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/currency-rates/v1.0/{currencyRate}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['rate']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as UpdateCurrencyRateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
