import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { CreateCurrencyRateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/currency-rates/v1.0

export const createCurrencyRateAction = createAction({
  auth: ampecoAuth,
  name: 'createCurrencyRate',
  displayName: 'Resources - Currency Rates - Create',
  description: 'Create new Currency Rate.',
  props: {
        
  base: Property.ShortText({
    displayName: 'Base',
    description: 'Base currency code (ISO 4217)',
    required: true,
  }),

  target: Property.ShortText({
    displayName: 'Target',
    description: 'Target currency code (ISO 4217)',
    required: true,
  }),

  rate: Property.Number({
    displayName: 'Rate',
    description: 'The exchange rate from base to target currency',
    required: true,
  }),
  },
  async run(context): Promise<CreateCurrencyRateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/currency-rates/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['base', 'target', 'rate']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as CreateCurrencyRateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
