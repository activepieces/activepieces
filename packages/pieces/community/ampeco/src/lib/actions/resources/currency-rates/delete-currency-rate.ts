import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const deleteCurrencyRateAction = createAction({
  auth: ampecoAuth,
  name: 'deleteCurrencyRate',
  displayName: 'Resources - Currency Rates - Delete Currency Rate',
  description: 'Delete Currency Rate. (Endpoint: DELETE /public-api/resources/currency-rates/v1.0/{currencyRate})',
  props: {
        
  currencyRate: Property.Number({
    displayName: 'Currency Rate',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/currency-rates/v1.0/{currencyRate}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
