import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ElectricityRatePricePeriodsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const electricityRatePricePeriodsListingAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsListing',
  displayName: 'Resources - Electricity Rates - Electricity Rate Price Periods Listing',
  description: 'List all of the configured price period days (including week days and dates). (Endpoint: GET /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods)',
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
