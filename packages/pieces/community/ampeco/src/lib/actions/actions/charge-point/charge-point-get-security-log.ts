import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointGetSecurityLogResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/get-security-log

export const chargePointGetSecurityLogAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointGetSecurityLog',
  displayName: 'Actions - Charge Point - Get Security Log',
  description: 'Charge Point / Get Security Log. ',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  url: Property.ShortText({
    displayName: 'URL',
    description: 'The URL of the location at the remote system where the log should be stored.',
    required: true,
  }),

  reason: Property.ShortText({
    displayName: 'Reason',
    description: 'Reason kept in the action logs for future reference.',
    required: true,
  }),

  retries: Property.Number({
    displayName: 'Retries',
    description: 'This specifies how many times the Charge Point must try to upload the log before giving up. If this field is not present, it is left to Charge Point to decide how many times it wants to retry.',
    required: false,
  }),

  interval: Property.Number({
    displayName: 'Interval',
    description: 'The interval in seconds after which a retry may be attempted. If this field is not present, it is left to Charge Point to decide how long to wait between attempts.',
    required: false,
  }),

  startTime: Property.ShortText({
    displayName: 'Start Time',
    description: 'This contains the date and time of the oldest logging information to include in the diagnostics. Please provide the value in the following format `Y-m-d H:i:s`.',
    required: false,
  }),

  stopTime: Property.ShortText({
    displayName: 'Stop Time',
    description: 'This contains the date and time of the latest logging information to include in the diagnostics. Please provide the value in the following format `Y-m-d H:i:s`.',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointGetSecurityLogResponse> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/get-security-log', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['url', 'reason', 'retries', 'interval', 'startTime', 'stopTime']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointGetSecurityLogResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
