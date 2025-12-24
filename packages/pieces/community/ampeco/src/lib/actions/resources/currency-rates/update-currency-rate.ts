import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { UpdateCurrencyRateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const updateCurrencyRateAction = createAction({
  auth: ampecoAuth,
  name: 'updateCurrencyRate',
  displayName: 'Resources - Currency Rates - Update Currency Rate',
  description: 'Update Currency Rate. (Endpoint: PATCH /public-api/resources/currency-rates/v1.0/{currencyRate})',
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
