import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ElectricityRatePricePeriodsDateListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const electricityRatePricePeriodsDateListingAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsDateListing',
  displayName: 'Resources - Electricity Rates - Electricity Rate Price Periods Date Listing',
  description: 'List all of the configured price period dates. (Endpoint: GET /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/date)',
  props: {
        
  electricityRate: Property.Number({
    displayName: 'Electricity Rate',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ElectricityRatePricePeriodsDateListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/date', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ElectricityRatePricePeriodsDateListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
