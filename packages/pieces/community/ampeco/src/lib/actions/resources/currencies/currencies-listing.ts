import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { CurrenciesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const currenciesListingAction = createAction({
  auth: ampecoAuth,
  name: 'currenciesListing',
  displayName: 'Resources - Currencies - Currencies Listing',
  description: 'Currencies / Listing. (Endpoint: GET /public-api/resources/currencies/v2.0)',
  props: {
  },
  async run(context): Promise<CurrenciesListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/currencies/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as CurrenciesListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
