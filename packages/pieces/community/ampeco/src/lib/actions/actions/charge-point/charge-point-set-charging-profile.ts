import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointSetChargingProfileResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/set-charging-profile/{evseNetworkId}

export const chargePointSetChargingProfileAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointSetChargingProfile',
  displayName: 'Actions - Charge Point - Set Charging Profile',
  description: 'Set a smart charging profile.',
  props: {
        
  evseNetworkId: Property.Number({
    displayName: 'Evse Network Id',
    required: true,
  }),

  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  transactionId: Property.Number({
    displayName: 'Transaction Id',
    required: false,
  }),

  stackLevel: Property.Number({
    displayName: 'Stack Level',
    required: true,
  }),

  chargingProfilePurpose: Property.StaticDropdown({
    displayName: 'Charging Profile Purpose',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'ChargePointMaxProfile', value: 'ChargePointMaxProfile' },
      { label: 'TxDefaultProfile', value: 'TxDefaultProfile' },
      { label: 'TxProfile', value: 'TxProfile' }
      ],
    },
  }),

  chargingProfileKind: Property.StaticDropdown({
    displayName: 'Charging Profile Kind',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'Absolute', value: 'Absolute' },
      { label: 'Recurring', value: 'Recurring' },
      { label: 'Relative', value: 'Relative' }
      ],
    },
  }),

  recurrencyKind: Property.StaticDropdown({
    displayName: 'Recurrency Kind',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'Daily', value: 'Daily' },
      { label: 'Weekly', value: 'Weekly' }
      ],
    },
  }),

  validFrom: Property.DateTime({
    displayName: 'Valid From',
    required: false,
  }),

  validTo: Property.DateTime({
    displayName: 'Valid To',
    required: false,
  }),

  chargingSchedule__id: Property.Number({
    displayName: 'Charging Schedule - Id',
    required: false,
  }),

  chargingSchedule__duration: Property.Number({
    displayName: 'Charging Schedule - Duration',
    required: false,
  }),

  chargingSchedule__startSchedule: Property.DateTime({
    displayName: 'Charging Schedule - Start Schedule',
    required: false,
  }),

  chargingSchedule__chargingRateUnit: Property.StaticDropdown({
    displayName: 'Charging Schedule - Charging Rate Unit',
    required: true,
    options: {
      options: [
      { label: 'A', value: 'A' },
      { label: 'W', value: 'W' }
      ],
    },
  }),

  chargingSchedule__chargingSchedulePeriod: Property.Array({
    displayName: 'Charging Schedule - Charging Schedule Period',
    required: true,
    properties: { 
         
  startPeriod: Property.Number({
    displayName: 'Start Period',
    required: true,
  }),

  limit: Property.Number({
    displayName: 'Limit',
    required: true,
  }),

  numberPhases: Property.Number({
    displayName: 'Number Phases',
    required: false,
  }), 
    },
  }),

  chargingSchedule__minChargingRate: Property.Number({
    displayName: 'Charging Schedule - Min Charging Rate',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointSetChargingProfileResponse> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/set-charging-profile/{evseNetworkId}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['transactionId', 'stackLevel', 'chargingProfilePurpose', 'chargingProfileKind', 'recurrencyKind', 'validFrom', 'validTo', 'chargingSchedule']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointSetChargingProfileResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
