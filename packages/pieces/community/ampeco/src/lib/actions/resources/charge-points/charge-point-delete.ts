import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: DELETE /public-api/resources/charge-points/v2.0/{chargePoint}
export const chargePointDeleteAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointDelete',
  displayName: 'Resources - Charge Points - Charge Point Delete',
  description: 'Delete a charge point.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
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
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
      const body = undefined;

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.DELETE,
        body,
        queryParams
      ) as unknown;

    } catch (error) {
      handleApiError(error);
    }
  },
});
