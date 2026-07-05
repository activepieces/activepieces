import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ElectricityRatePricePeriodsWeekDayListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/week-day

export const electricityRatePricePeriodsWeekDayListingAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsWeekDayListing',
  displayName: 'Resources - Electricity Rates - Price Periods Week Day Listing',
  description: 'List all of the configured price period week days.',
  audience: 'both',
  aiMetadata: { description: 'List the configured recurring week-day price periods for an electricity rate in AMPECO (e.g. Monday, weekend, or any). Read-only and safe to repeat. Use the date listing action for one-off calendar-date periods, or the combined listing for both.', idempotent: true },
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
