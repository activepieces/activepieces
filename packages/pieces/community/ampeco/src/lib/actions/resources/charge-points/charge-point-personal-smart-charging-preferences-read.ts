import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointPersonalSmartChargingPreferencesReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointPersonalSmartChargingPreferencesReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointPersonalSmartChargingPreferencesRead',
  displayName: 'Resources - Charge Points - Charge Point Personal Smart Charging Preferences Read',
  description: 'Get personal smart charging preferences of the charge point. (Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}/personal-smart-charging-preferences)',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
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
