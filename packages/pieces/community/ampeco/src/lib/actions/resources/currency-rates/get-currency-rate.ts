import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { GetCurrencyRateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/currency-rates/v1.0/{currencyRate}

export const getCurrencyRateAction = createAction({
  auth: ampecoAuth,
  name: 'getCurrencyRate',
  displayName: 'Resources - Currency Rates - Get',
  description: 'Get Currency Rate.',
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
