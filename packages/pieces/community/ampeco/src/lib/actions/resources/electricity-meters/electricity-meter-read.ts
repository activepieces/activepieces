import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ElectricityMeterReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/electricity-meters/v1.0/{electricityMeter}

export const electricityMeterReadAction = createAction({
  auth: ampecoAuth,
  name: 'electricityMeterRead',
  displayName: 'Resources - Electricity Meters - Read',
  description: 'Get information for an electricity meter by ID.',
  audience: 'both',
  aiMetadata: { description: 'Fetch the details of a single AMPECO electricity meter by its numeric ID. Read-only and idempotent. Pick this when you already have a meter ID; to browse all meters, use the electricity meters listing action.', idempotent: true },
  props: {
        
  electricityMeter: Property.Number({
    displayName: 'Electricity Meter',
    required: true,
  }),
  },
  async run(context): Promise<ElectricityMeterReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/electricity-meters/v1.0/{electricityMeter}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ElectricityMeterReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
