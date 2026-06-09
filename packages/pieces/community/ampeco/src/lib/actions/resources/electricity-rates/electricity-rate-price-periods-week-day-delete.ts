import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/week-day/{weekDay}

export const electricityRatePricePeriodsWeekDayDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsWeekDayDelete',
  displayName: 'Resources - Electricity Rates - Price Periods Week Day Delete',
  description: 'Delete the price periods for a specific week day.',
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
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/week-day/{weekDay}', context.propsValue);
      
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
