import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { EvseStartChargingWithEvseIdResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/actions/evse/v1.0/{evse}/start
export const evseStartChargingWithEvseIdAction = createAction({
  auth: ampecoAuth,
  name: 'evseStartChargingWithEvseId',
  displayName: 'Actions - EVSE - Start Charging With EVSE Id',
  description: 'Start a charging session.',
  props: {
        
  evse: Property.Number({
    displayName: 'EVSE',
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
    description: '',
    required: false,
  }),

  connectorId: Property.Number({
    displayName: 'Connector Id',
    description: '',
    required: false,
  }),

  bookingId: Property.Number({
    displayName: 'Booking Id',
    description: 'The ID of the booking to link the session to. Returns a 422 error if the booking does not exist or if its status is not Accepted or Reserved.',
    required: false,
  }),

  chargingProfile__transactionId: Property.Number({
    displayName: 'Charging Profile - Transaction Id',
    description: '',
    required: false,
  }),

  chargingProfile__stackLevel: Property.Number({
    displayName: 'Charging Profile - Stack Level',
    description: '',
    required: true,
  }),

  chargingProfile__chargingProfilePurpose: Property.StaticDropdown({
    displayName: 'Charging Profile - Charging Profile Purpose',
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

  chargingProfile__chargingProfileKind: Property.StaticDropdown({
    displayName: 'Charging Profile - Charging Profile Kind',
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

  chargingProfile__recurrencyKind: Property.StaticDropdown({
    displayName: 'Charging Profile - Recurrency Kind',
    description: '',
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
    description: '',
    required: false,
  }),

  chargingProfile__validTo: Property.DateTime({
    displayName: 'Charging Profile - Valid To',
    description: '',
    required: false,
  }),

  chargingProfile__chargingSchedule__id: Property.Number({
    displayName: 'Charging Profile - Charging Schedule - Id',
    description: '',
    required: false,
  }),

  chargingProfile__chargingSchedule__duration: Property.Number({
    displayName: 'Charging Profile - Charging Schedule - Duration',
    description: '',
    required: false,
  }),

  chargingProfile__chargingSchedule__startSchedule: Property.DateTime({
    displayName: 'Charging Profile - Charging Schedule - Start Schedule',
    description: '',
    required: false,
  }),

  chargingProfile__chargingSchedule__chargingRateUnit: Property.StaticDropdown({
    displayName: 'Charging Profile - Charging Schedule - Charging Rate Unit',
    description: '',
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
    description: '',
    required: true,
    properties: { 
         
  startPeriod: Property.Number({
    displayName: 'Start Period',
    description: '',
    required: true,
  }),

  limit: Property.Number({
    displayName: 'Limit',
    description: '',
    required: true,
  }),

  numberPhases: Property.Number({
    displayName: 'Number Phases',
    description: '',
    required: false,
  }), 
    },
  }),

  chargingProfile__chargingSchedule__minChargingRate: Property.Number({
    displayName: 'Charging Profile - Charging Schedule - Min Charging Rate',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<EvseStartChargingWithEvseIdResponse> {
    try {
      const url = processPathParameters('/public-api/actions/evse/v1.0/{evse}/start', context.propsValue);
      
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
      ) as EvseStartChargingWithEvseIdResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
