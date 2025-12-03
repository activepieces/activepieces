import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const electricityRatePricePeriodsDateDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRatePricePeriodsDateDelete',
  displayName: 'Resources - Electricity Rates - Electricity Rate Price Periods Date Delete',
  description: 'Delete the price periods for a specific date. (Endpoint: DELETE /public-api/resources/electricity-rates/v2.0/{electricityRate}/price-periods/date/{date})',
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
