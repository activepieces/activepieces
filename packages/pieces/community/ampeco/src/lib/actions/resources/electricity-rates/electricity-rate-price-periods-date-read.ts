import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ElectricityRatePricePeriodsDateReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const electricityRatePricePeriodsDateReadAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsDateRead',
  displayName: 'Resources - Electricity Rates - Electricity Rate Price Periods Date Read',
  description: 'Get the price periods for a specific date. (Endpoint: GET /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/date/{date})',
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
