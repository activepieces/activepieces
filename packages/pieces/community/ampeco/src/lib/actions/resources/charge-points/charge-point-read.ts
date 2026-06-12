import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { ChargePointReadResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/charge-points/v2.0/{chargePoint}

export const chargePointReadAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointRead',
  displayName: 'Resources - Charge Points - Charge Point Read',
  description: 'Get a charge point.',
  audience: 'both',
  aiMetadata: { description: 'Fetch the full configuration of a single charge point by its numeric ID, optionally expanding related data such as smart charging or last boot notification via Include. Read-only and safe to repeat. For just the live availability use charge-point-status-read; to scan or filter many charge points use charge-points-listing.', idempotent: true },
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
