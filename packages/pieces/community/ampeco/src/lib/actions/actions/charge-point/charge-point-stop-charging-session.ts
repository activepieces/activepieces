import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/stop/{session}

export const chargePointStopChargingSessionAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointStopChargingSession',
  displayName: 'Actions - Charge Point - Stop Charging Session',
  description: 'Stop a charging session.',
  audience: 'both',
  aiMetadata: { description: 'Remotely stop an active charging session on a charge point by session id; set force=true to end it in the backend regardless of the charge point response. Use to terminate an in-progress charge. Stopping an already-stopped session is effectively a no-op, so it is safe to retry for a given session id.', idempotent: true },
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  session: Property.Number({
    displayName: 'Session',
    required: true,
  }),

  force: Property.StaticDropdown({
    displayName: 'Force',
    description: 'Use force=true when you want to end the session reguardless of the CP response',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/stop/{session}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['force']
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
