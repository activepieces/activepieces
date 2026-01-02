import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { GetCurrencyRateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const getCurrencyRateAction = createAction({
  auth: ampecoAuth,
  name: 'getCurrencyRate',
  displayName: 'Resources - Currency Rates - Get Currency Rate',
  description: 'Get Currency Rate. (Endpoint: GET /public-api/resources/currency-rates/v1.0/{currencyRate})',
  props: {
        
  currencyRate: Property.Number({
    displayName: 'Currency Rate',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<GetCurrencyRateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/currency-rates/v1.0/{currencyRate}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as GetCurrencyRateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
