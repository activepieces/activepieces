import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ElectricityRatePricePeriodsDateListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/date
export const electricityRatePricePeriodsDateListingAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsDateListing',
  displayName: 'Resources - Electricity Rates - Price Periods Date Listing',
  description: 'List all of the configured price period dates.',
  audience: 'both',
  aiMetadata: { description: 'List the configured one-off, calendar-date price periods for an electricity rate in AMPECO. Read-only and safe to repeat. Use the week-day listing action for recurring weekly periods, or the combined listing for both kinds.', idempotent: true },
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
