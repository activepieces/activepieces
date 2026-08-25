import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ChargePointEvseUnlockResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/unlock/{evse}

export const chargePointEvseUnlockAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointEvseUnlock',
  displayName: 'Actions - Charge Point - EVSE Unlock',
  description: 'Unlock an EVSE.',
  audience: 'both',
  aiMetadata: { description: 'Send an OCPP UnlockConnector command to release the cable lock on a specific EVSE (connector) of a charge point. Use when a driver cannot remove their cable and the connector needs to be unlocked remotely. Unlocking an already-unlocked connector is harmless, so it is safe to retry.', idempotent: true },
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  evse: Property.Number({
    displayName: 'Evse',
    description: '',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointEvseUnlockResponse> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/unlock/{evse}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointEvseUnlockResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
