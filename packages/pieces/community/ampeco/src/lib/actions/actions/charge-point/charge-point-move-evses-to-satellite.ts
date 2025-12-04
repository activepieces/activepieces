import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointMoveEvsesToSatelliteAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointMoveEvsesToSatellite',
  displayName: 'Actions - Charge Point - Charge Point Move Evses To Satellite',
  description: 'Move one or more EVSEs from this charge point to a satellite charge point. (Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/move-evses-to-satellite)',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  satelliteChargePointId: Property.Number({
    displayName: 'Satellite Charge Point Id',
    description: '',
    required: true,
  }),

  evseIds: Property.Array({
    displayName: 'Evse Ids',
    description: '',
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
