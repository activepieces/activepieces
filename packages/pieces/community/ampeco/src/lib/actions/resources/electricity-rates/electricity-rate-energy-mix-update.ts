import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ElectricityRateEnergyMixUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PUT /public-api/resources/electricity-rates/v2.0/{electricityRate}/energy-mix

export const electricityRateEnergyMixUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRateEnergyMixUpdate',
  displayName: 'Resources - Electricity Rates - Energy Mix Update',
  description: 'Set an electricity rate energy mix. By default the energy mix generated with creation of the electricity rate is filled with 0.',
  props: {
        
  electricityRate: Property.Number({
    displayName: 'Electricity Rate',
    description: '',
    required: true,
  }),

  solar: Property.Number({
    displayName: 'Solar',
    description: 'Represents what percent of the energy is generated from solar power.',
    required: false,
  }),

  wind: Property.Number({
    displayName: 'Wind',
    description: 'Represents what percent of the energy is generated from wind turbines.',
    required: false,
  }),

  hydro: Property.Number({
    displayName: 'Hydro',
    description: 'Represents what percent of the energy is generated from hydropower.',
    required: false,
  }),

  nuclear: Property.Number({
    displayName: 'Nuclear',
    description: 'Represents what percent of the energy is generated from nuclear power plants.',
    required: false,
  }),

  coal: Property.Number({
    displayName: 'Coal',
    description: 'Represents what percent of the energy is generated from burning coal.',
    required: false,
  }),

  naturalGas: Property.Number({
    displayName: 'Natural Gas',
    description: 'Represents what percent of the energy is generated from natural gas.',
    required: false,
  }),

  otherRenewable: Property.Number({
    displayName: 'Other Renewable',
    description: 'Represents what percent of the energy is generated from any other type of renewable energy source. This could include any other renewable source not specifically listed.',
    required: false,
  }),

  otherNonRenewable: Property.Number({
    displayName: 'Other Non Renewable',
    description: 'Represents what percent of the energy is generated from any other type of non-renewable energy source. This could include any other non-renewable source not specifically listed.',
    required: false,
  }),
  },
  async run(context): Promise<ElectricityRateEnergyMixUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0/{electricityRate}/energy-mix', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['solar', 'wind', 'hydro', 'nuclear', 'coal', 'naturalGas', 'otherRenewable', 'otherNonRenewable']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PUT,
        body,
        queryParams
      ) as ElectricityRateEnergyMixUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
