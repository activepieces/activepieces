import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ChargePointEvseReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/evses/{evse}

export const chargePointEvseReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointEvseRead',
  displayName: 'Resources - Charge Points - Charge Point Evse Read',
  description: 'Get an EVSE from a Charge Point.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  evse: Property.Number({
    displayName: 'Evse',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    required: false,
    options: {
      options: [
      { label: 'chargingProfile', value: 'chargingProfile' },
      { label: 'connectors', value: 'connectors' }
      ],
    },
  }),
  },
  async run(context): Promise<ChargePointEvseReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/evses/{evse}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointEvseReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
