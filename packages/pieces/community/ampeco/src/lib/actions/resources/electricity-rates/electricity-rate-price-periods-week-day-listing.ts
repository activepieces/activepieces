import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ElectricityRatePricePeriodsWeekDayListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const electricityRatePricePeriodsWeekDayListingAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsWeekDayListing',
  displayName: 'Resources - Electricity Rates - Electricity Rate Price Periods Week Day Listing',
  description: 'List all of the configured price period week days. (Endpoint: GET /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/week-day)',
  props: {
        
  electricityRate: Property.Number({
    displayName: 'Electricity Rate',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ElectricityRatePricePeriodsWeekDayListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/week-day', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ElectricityRatePricePeriodsWeekDayListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
