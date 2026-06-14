import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ElectricityRatePricePeriodsDateReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/date/{date}

export const electricityRatePricePeriodsDateReadAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsDateRead',
  displayName: 'Resources - Electricity Rates - Price Periods Date Read',
  description: 'Get the price periods for a specific date.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve the configured time-of-day price periods for one specific calendar date (YYYY-MM-DD) of an electricity rate in AMPECO. Read-only and safe to repeat. Use the week-day read action for recurring weekly periods instead.', idempotent: true },
  props: {
        
  electricityRate: Property.Number({
    displayName: 'Electricity Rate',
    description: '',
    required: true,
  }),

  date: Property.DateTime({
    displayName: 'Date',
    description: 'Uses the YYYY-MM-DD date format.',
    required: true,
  }),
  },
  async run(context): Promise<ElectricityRatePricePeriodsDateReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/date/{date}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ElectricityRatePricePeriodsDateReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
