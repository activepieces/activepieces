import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointSyncConfigurationResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/sync-configuration

export const chargePointSyncConfigurationAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointSyncConfiguration',
  displayName: 'Actions - Charge Point - Sync Configuration',
  description: 'Send a partial or full sync configuration request to the chargepoint. You will get back a requerstId that you can monitor the status of using the ChargePointSyncConfigurationNotification. Please note that calling this action should not be required, as each time the charge point boots the configuration is automatically synced.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  keys: Property.Array({
    displayName: 'Keys',
    description: 'List of keys to request a get configuration for. Omit or pass empty array to request all available configuration keys.',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointSyncConfigurationResponse> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/sync-configuration', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['keys']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointSyncConfigurationResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
