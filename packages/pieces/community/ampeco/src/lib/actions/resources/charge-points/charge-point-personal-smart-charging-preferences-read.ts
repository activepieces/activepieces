import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ChargePointPersonalSmartChargingPreferencesReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/personal-smart-charging-preferences

export const chargePointPersonalSmartChargingPreferencesReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointPersonalSmartChargingPreferencesRead',
  displayName: 'Resources - Charge Points - Charge Point Personal Smart Charging Preferences Read',
  description: 'Get personal smart charging preferences of the charge point.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),
  },
  async run(context): Promise<ChargePointPersonalSmartChargingPreferencesReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/personal-smart-charging-preferences', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointPersonalSmartChargingPreferencesReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
