import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';
import { ChargePointReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointRead',
  displayName: 'Resources - Charge Points - Charge Point Read',
  description: 'Get a charge point. (Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint})',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'lastBootNotification', value: 'lastBootNotification' },
      { label: 'chargingProfile', value: 'chargingProfile' },
      { label: 'smartCharging', value: 'smartCharging' },
      { label: 'smartChargingPreferences', value: 'smartChargingPreferences' },
      { label: 'personalSmartChargingPreferences', value: 'personalSmartChargingPreferences' },
      { label: 'availablePersonalSmartChargingModes', value: 'availablePersonalSmartChargingModes' }
      ],
    },
  }),
  },
  async run(context): Promise<ChargePointReadResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as ChargePointReadResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
