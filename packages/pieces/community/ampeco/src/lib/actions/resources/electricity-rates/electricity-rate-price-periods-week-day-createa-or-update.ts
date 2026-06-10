import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ElectricityRatePricePeriodsWeekDayCreateaOrUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PUT /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/week-day/{weekDay}

export const electricityRatePricePeriodsWeekDayCreateaOrUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsWeekDayCreateaOrUpdate',
  displayName: 'Resources - Electricity Rates - Price Periods Week Day Createa Or Update',
  description: 'Update the price periods for a specific week day. This operation will overwrite all existing periods for the given day, so a complete list must be provided.',
  props: {
        
  electricityRate: Property.Number({
    displayName: 'Electricity Rate',
    description: '',
    required: true,
  }),

  weekDay: Property.StaticDropdown({
    displayName: 'Week Day',
    description: 'Can be one of the listed days of the week or `any`.',
    required: true,
    options: {
      options: [
      { label: 'mon', value: 'mon' },
      { label: 'tue', value: 'tue' },
      { label: 'wed', value: 'wed' },
      { label: 'thu', value: 'thu' },
      { label: 'fri', value: 'fri' },
      { label: 'sat', value: 'sat' },
      { label: 'sun', value: 'sun' },
      { label: 'any', value: 'any' }
      ],
    },
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
  async run(context): Promise<ElectricityRatePricePeriodsWeekDayCreateaOrUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/week-day/{weekDay}', context.propsValue);
      
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
      ) as ElectricityRatePricePeriodsWeekDayCreateaOrUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
