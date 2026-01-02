import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ElectricityRatePricePeriodsWeekDayReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const electricityRatePricePeriodsWeekDayReadAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsWeekDayRead',
  displayName: 'Resources - Electricity Rates - Electricity Rate Price Periods Week Day Read',
  description: 'Get the price periods for a specific week day. (Endpoint: GET /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/week-day/{weekDay})',
  props: {
        
  electricityRate: Property.Number({
    displayName: 'Electricity Rate',
    description: '',
    required: true,
  }),

  weekDay: Property.StaticDropdown({
    displayName: 'Week Day',
    description: 'Can be one of the listed days of the week or \`any\`.',
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
  async run(context): Promise<ElectricityRatePricePeriodsWeekDayReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/week-day/{weekDay}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ElectricityRatePricePeriodsWeekDayReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
