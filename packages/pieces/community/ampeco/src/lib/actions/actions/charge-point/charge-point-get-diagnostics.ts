import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointGetDiagnosticsResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/get-diagnostics

export const chargePointGetDiagnosticsAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointGetDiagnostics',
  displayName: 'Actions - Charge Point - Get Diagnostics',
  description: 'Request a get diagnostics upload from the charge point.',
  audience: 'both',
  aiMetadata: { description: 'Send an OCPP GetDiagnostics command instructing a charge point to upload its diagnostics file to the given FTP location, optionally bounded by a start/stop date-time window. Use to collect device diagnostics for troubleshooting. Each call triggers a fresh upload, so it is not idempotent.', idempotent: false },
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  location: Property.ShortText({
    displayName: 'Location',
    description: 'FTP address to upload the diagnostics to',
    required: true,
  }),

  start: Property.DateTime({
    displayName: 'Start',
    description: 'Only get diagnostics that are created after this date-time',
    required: false,
  }),

  stop: Property.DateTime({
    displayName: 'Stop',
    description: 'Only get diagnostics that are created before that date-time',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointGetDiagnosticsResponse> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/get-diagnostics', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['location', 'start', 'stop']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointGetDiagnosticsResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
