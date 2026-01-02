import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { CurrenciesListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/currencies/v2.0

export const currenciesListingAction = createAction({
  auth: ampecoAuth,
  name: 'currenciesListing',
  displayName: 'Resources - Currencies - Listing',
  description: 'Currencies / Listing.',
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
