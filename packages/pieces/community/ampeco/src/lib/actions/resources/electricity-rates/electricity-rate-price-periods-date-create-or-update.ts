import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ElectricityRatePricePeriodsDateCreateOrUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PUT /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/date/{date}

export const electricityRatePricePeriodsDateCreateOrUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsDateCreateOrUpdate',
  displayName: 'Resources - Electricity Rates - Price Periods Date Create Or Update',
  description: 'Update the price periods for a specific date. This operation will overwrite all existing periods for the given date, so a complete list must be provided.',
  audience: 'both',
  aiMetadata: { description: 'Set the full list of time-of-day price periods for one specific calendar date (YYYY-MM-DD) of an electricity rate in AMPECO. This replaces all existing periods for that date, so always send the complete list; resending the same list leaves the date in the same state. Use the week-day variant to set recurring weekly pricing.', idempotent: true },
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

  periods: Property.Array({
    displayName: 'Periods',
    description: '',
    required: true,
    properties: { 
         
  startsAt: Property.ShortText({
    displayName: 'Starts At',
    description: 'The start time of the period. Formatted as hours:minutes. Should be provided in the local time zone and not in UTC.',
    required: true,
  }),

  endsAt: Property.ShortText({
    displayName: 'Ends At',
    description: 'The end time of the period. Formatted as hours:minutes. Should be provided in the local time zone and not in UTC.',
    required: true,
  }),

  price: Property.Number({
    displayName: 'Price',
    description: 'The price that will apply for the given price period. Must include tax.',
    required: true,
  }), 
    },
  }),
  },
  async run(context): Promise<ElectricityRatePricePeriodsDateCreateOrUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/date/{date}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['periods']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PUT,
        body,
        queryParams
      ) as ElectricityRatePricePeriodsDateCreateOrUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
