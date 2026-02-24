import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ElectricityRateUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: PATCH /public-api/resources/electricity-rates/v2.0/{electricityRate}

export const electricityRateUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'electricityRateUpdate',
  displayName: 'Resources - Electricity Rates - Update',
  description: 'Update a Electricity rate.',
  props: {
        
  electricityRate: Property.Number({
    displayName: 'Electricity Rate',
    description: '',
    required: true,
  }),

  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: false,
  }),

  utilityId: Property.Number({
    displayName: 'Utility Id',
    description: 'The id of the utility providing the electricity. Configured in the Ampeco admin panel.',
    required: false,
  }),

  defaultPrice: Property.Number({
    displayName: 'Default Price',
    description: `The default price per kWh, which will be applied if there is no pricing supplied for a time interval.\nPrices of all electricity rates created through the Public API or tha Ampeco admin panel must include the tax in the price.\nPrice per kWh.\n`,
    required: false,
  }),

  taxPercentage: Property.Number({
    displayName: 'Tax Percentage',
    description: 'This field is used only to indicate the applied tax. All Electricity Rate prices should be provided with the tax included in the price.',
    required: false,
  }),
  },
  async run(context): Promise<ElectricityRateUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-rates/v2.0/{electricityRate}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'utilityId', 'defaultPrice', 'taxPercentage']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as ElectricityRateUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
