import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ElectricityRateEnergyMixReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/electricity-rates/v2.0/{electricityRate}/energy-mix

export const electricityRateEnergyMixReadAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRateEnergyMixRead',
  displayName: 'Resources - Electricity Rates - Electricity Rate Energy Mix Read',
  description: 'Get an electricity rate energy mix.',
  audience: 'both',
  aiMetadata: { description: 'Retrieve the energy-source mix (percentages for solar, wind, hydro, nuclear, coal, gas and other sources) of a given electricity rate in AMPECO. Read-only and safe to repeat. Use the energy-mix update action to change these percentages.', idempotent: true },
  props: {
        
  electricityRate: Property.Number({
    displayName: 'Electricity Rate',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ElectricityRateEnergyMixReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0/{electricityRate}/energy-mix', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ElectricityRateEnergyMixReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
