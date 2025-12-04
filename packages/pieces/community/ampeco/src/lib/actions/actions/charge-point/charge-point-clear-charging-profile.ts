import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAmpecoApiCall, processPathParameters, prepareQueryParams, prepareRequestBody, paginate, handleApiError } from '../../../common/utils';
import { ampecoAuth } from '../../../common/auth';

/**
 * Generated from API version: 3.96.4
 */
export const chargePointClearChargingProfileAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointClearChargingProfile',
  displayName: 'Actions - Charge Point - Charge Point Clear Charging Profile',
  description: 'If you are not using networkId and not passing other criteria in the body it will clear the charging profile for the charge point (ChargePointMaxProfile). (Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/clear-charging-profile)',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  id: Property.Number({
    displayName: 'Id',
    description: 'The ID of the charging profile to clear.',
    required: false,
  }),

  evseNetworkId: Property.ShortText({
    displayName: 'Evse Network Id',
    description: 'Specifies the ID of the connector for which to clear charging profiles. A connectorId of zero (0) specifies the charging profile for the overall Charge Point. Absence of this parameter means the clearing applies to all charging profiles that match the other criteria in the request.',
    required: false,
  }),

  chargingProfilePurpose: Property.ShortText({
    displayName: 'Charging Profile Purpose',
    description: 'Specifies to purpose of the charging profiles that will be cleared, if they meet the other criteria in the request.',
    required: false,
  }),

  stackLevel: Property.Number({
    displayName: 'Stack Level',
    description: 'Specifies the stackLevel for which charging profiles will be cleared, if they meet the other criteria in the request.',
    required: false,
  }),
  },
  async run(context): Promise<unknown> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/clear-charging-profile', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['id', 'evseNetworkId', 'chargingProfilePurpose', 'stackLevel']
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
