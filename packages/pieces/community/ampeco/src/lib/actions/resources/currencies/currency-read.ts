import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { CurrencyReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const currencyReadAction = createAction({
  auth: ampecoAuth,
  name: 'currencyRead',
  displayName: 'Resources - Currencies - Currency Read',
  description: 'Currency / Read. (Endpoint: GET /public-api/resources/currencies/v2.0/{currency})',
  props: {
        
  currency: Property.Number({
    displayName: 'Currency',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<CurrencyReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/currencies/v2.0/{currency}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as CurrencyReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
