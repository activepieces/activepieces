import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ElectricityRatePricePeriodsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods

export const electricityRatePricePeriodsListingAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsListing',
  displayName: 'Resources - Electricity Rates - Price Periods Listing',
  description: 'List all of the configured price period days (including week days and dates).',
  props: {
        
  electricityRate: Property.Number({
    displayName: 'Electricity Rate',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ElectricityRatePricePeriodsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ElectricityRatePricePeriodsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
