import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/date/{date}

export const electricityRatePricePeriodsDateDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsDateDelete',
  displayName: 'Resources - Electricity Rates - Price Periods Date Delete',
  description: 'Delete the price periods for a specific date.',
  audience: 'both',
  aiMetadata: { description: 'Remove all configured price periods for one specific calendar date (YYYY-MM-DD) of an electricity rate in AMPECO, reverting that date to the rate default pricing. Destructive write; confirm the rate id and date first. Use the week-day delete action to clear a recurring week day instead.', idempotent: false },
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
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/date/{date}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
