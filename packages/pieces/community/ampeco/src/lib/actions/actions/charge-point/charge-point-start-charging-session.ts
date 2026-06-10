import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointStartChargingSessionResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/charge-point/v1.0/{chargePoint}/start/{evse}

export const chargePointStartChargingSessionAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointStartChargingSession',
  displayName: 'Actions - Charge Point - Start Charging Session',
  description: 'Start a charging session.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  evse: Property.Number({
    displayName: 'Evse',
    required: true,
  }),

  userId: Property.Number({
    displayName: 'User Id',
    required: false,
  }),

  paymentMethodId: Property.ShortText({
    displayName: 'Payment Method Id',
    description: 'The ID of the payment method, as returned by the payment method listing (User / Payment Method / Listing). When left empty or null, it would be determined by the system - either "balance" or "subscription" (in case the the user has an active post-paid subscription for home charging sessions and the charge point is a home charger). When it is NOT empty or null, userId is required.',
    required: false,
  }),

  externalSessionId: Property.ShortText({
    displayName: 'External Session Id',
    required: false,
  }),

  connectorId: Property.Number({
    displayName: 'Connector Id',
    required: false,
  }),

  bookingId: Property.Number({
    displayName: 'Booking Id',
    description: 'The ID of the booking to link the session to. Returns a 422 error if the booking does not exist or if its status is not Accepted or Reserved.',
    required: false,
  }),

  chargingProfile__transactionId: Property.Number({
    displayName: 'Charging Profile - Transaction Id',
    required: false,
  }),

  chargingProfile__stackLevel: Property.Number({
    displayName: 'Charging Profile - Stack Level',
    required: true,
  }),

  chargingProfile__chargingProfilePurpose: Property.StaticDropdown({
    displayName: 'Charging Profile - Charging Profile Purpose',
    required: true,
    options: {
      options: [
      { label: 'ChargePointMaxProfile', value: 'ChargePointMaxProfile' },
      { label: 'TxDefaultProfile', value: 'TxDefaultProfile' },
      { label: 'TxProfile', value: 'TxProfile' }
      ],
    },
  }),

  chargingProfile__chargingProfileKind: Property.StaticDropdown({
    displayName: 'Charging Profile - Charging Profile Kind',
    required: true,
    options: {
      options: [
      { label: 'Absolute', value: 'Absolute' },
      { label: 'Recurring', value: 'Recurring' },
      { label: 'Relative', value: 'Relative' }
      ],
    },
  }),

  chargingProfile__recurrencyKind: Property.StaticDropdown({
    displayName: 'Charging Profile - Recurrency Kind',
    required: false,
    options: {
      options: [
      { label: 'Daily', value: 'Daily' },
      { label: 'Weekly', value: 'Weekly' }
      ],
    },
  }),

  chargingProfile__validFrom: Property.DateTime({
    displayName: 'Charging Profile - Valid From',
    required: false,
  }),

  chargingProfile__validTo: Property.DateTime({
    displayName: 'Charging Profile - Valid To',
    required: false,
  }),

  chargingProfile__chargingSchedule__id: Property.Number({
    displayName: 'Charging Profile - Charging Schedule - Id',
    required: false,
  }),

  chargingProfile__chargingSchedule__duration: Property.Number({
    displayName: 'Charging Profile - Charging Schedule - Duration',
    required: false,
  }),

  chargingProfile__chargingSchedule__startSchedule: Property.DateTime({
    displayName: 'Charging Profile - Charging Schedule - Start Schedule',
    required: false,
  }),

  chargingProfile__chargingSchedule__chargingRateUnit: Property.StaticDropdown({
    displayName: 'Charging Profile - Charging Schedule - Charging Rate Unit',
    required: true,
    options: {
      options: [
      { label: 'A', value: 'A' },
      { label: 'W', value: 'W' }
      ],
    },
  }),

  chargingProfile__chargingSchedule__chargingSchedulePeriod: Property.Array({
    displayName: 'Charging Profile - Charging Schedule - Charging Schedule Period',
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

  chargingProfile__chargingSchedule__minChargingRate: Property.Number({
    displayName: 'Charging Profile - Charging Schedule - Min Charging Rate',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointStartChargingSessionResponse> {
    try {
      const url = processPathParameters('/public-api/actions/charge-point/v1.0/{chargePoint}/start/{evse}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['userId', 'paymentMethodId', 'externalSessionId', 'connectorId', 'bookingId', 'chargingProfile']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointStartChargingSessionResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
