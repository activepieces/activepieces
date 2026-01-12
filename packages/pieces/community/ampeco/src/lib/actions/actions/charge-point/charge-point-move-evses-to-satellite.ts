import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/move-evses-to-satellite

export const chargePointMoveEvsesToSatelliteAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointMoveEvsesToSatellite',
  displayName: 'Actions - Charge Point - Move EVSEs To Satellite',
  description: 'Move one or more EVSEs from this charge point to a satellite charge point.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  satelliteChargePointId: Property.Number({
    displayName: 'Satellite Charge Point Id',
    required: true,
  }),

  evseIds: Property.Array({
    displayName: 'EVSE Ids',
    required: true,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/move-evses-to-satellite', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['satelliteChargePointId', 'evseIds']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
