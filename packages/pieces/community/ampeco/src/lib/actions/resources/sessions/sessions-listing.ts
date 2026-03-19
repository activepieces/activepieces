import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, paginate, prepareQueryParams, processPathParameters } from '../../../common/utils';
import { SessionsListingResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: GET /public-api/resources/sessions/v1.0

export const sessionsListingAction = createAction({
  auth: ampecoAuth,
  name: 'sessionsListing',
  displayName: 'Resources - Sessions - Listing',
  description: 'Sessions / Listing.',
  props: {
        
  withClockAlignedEnergyConsumption: Property.StaticDropdown({
    displayName: 'With Clock Aligned Energy Consumption',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  clockAlignedInterval: Property.StaticDropdown({
    displayName: 'Clock Aligned Interval',
    description: '',
    required: false,
    options: {
      options: [
      { label: '15', value: '15' },
      { label: '30', value: '30' },
      { label: '60', value: '60' }
      ],
    },
  }),

  withAuthorization: Property.StaticDropdown({
    displayName: 'With Authorization',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  withPriceBreakdown: Property.StaticDropdown({
    displayName: 'With Price Breakdown',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  withChargingPeriods: Property.StaticDropdown({
    displayName: 'With Charging Periods',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  withChargingPeriodsPriceBreakdown: Property.StaticDropdown({
    displayName: 'With Charging Periods Price Breakdown',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  filter__evseId: Property.Number({
    displayName: 'Filter - Evse Id',
    description: 'Only list sessions on a certain EVSE',
    required: false,
  }),

  filter__chargePointId: Property.Number({
    displayName: 'Filter - Charge Point Id',
    description: 'Only list sessions on a certain Charge Point',
    required: false,
  }),

  filter__evsePhysicalReference: Property.ShortText({
    displayName: 'Filter - Evse Physical Reference',
    description: 'Only list sessions on a certain EVSE, identified by the phisicalReference',
    required: false,
  }),

  filter__chargePointNetworkId: Property.ShortText({
    displayName: 'Filter - Charge Point Network Id',
    description: 'Only list sessions on a certain Charge Point, identified by the NetworkId',
    required: false,
  }),

  filter__reason: Property.StaticDropdown({
    displayName: 'Filter - Reason',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'working_hours_exceeded', value: 'working_hours_exceeded' },
      { label: 'timeout', value: 'timeout' },
      { label: 'authorization_amount_reached', value: 'authorization_amount_reached' },
      { label: 'new_start_transaction_received', value: 'new_start_transaction_received' },
      { label: 'force_stop', value: 'force_stop' },
      { label: 'standard_stop', value: 'standard_stop' },
      { label: 'energy_exceeded', value: 'energy_exceeded' },
      { label: 'schedule_completed', value: 'schedule_completed' },
      { label: 'pre_authorization_failed', value: 'pre_authorization_failed' },
      { label: 'system_force_stop', value: 'system_force_stop' },
      { label: 'time_limit', value: 'time_limit' },
      { label: 'balance_exceeded', value: 'balance_exceeded' },
      { label: 'deauthorized', value: 'deauthorized' },
      { label: 'emergencystop', value: 'emergencystop' },
      { label: 'energylimitreached', value: 'energylimitreached' },
      { label: 'evdisconnected', value: 'evdisconnected' },
      { label: 'groundfault', value: 'groundfault' },
      { label: 'immediatereset', value: 'immediatereset' },
      { label: 'hardreset', value: 'hardreset' },
      { label: 'local', value: 'local' },
      { label: 'localoutofcredit', value: 'localoutofcredit' },
      { label: 'masterpass', value: 'masterpass' },
      { label: 'other', value: 'other' },
      { label: 'overcurrentfault', value: 'overcurrentfault' },
      { label: 'powerloss', value: 'powerloss' },
      { label: 'powerquality', value: 'powerquality' },
      { label: 'reboot', value: 'reboot' },
      { label: 'remote', value: 'remote' },
      { label: 'soclimitreached', value: 'soclimitreached' },
      { label: 'stoppedbyev', value: 'stoppedbyev' },
      { label: 'timeoutlimitreached', value: 'timeoutlimitreached' },
      { label: 'softreset', value: 'softreset' },
      { label: 'unlockcommand', value: 'unlockcommand' },
      { label: 'no_ev_parked', value: 'no_ev_parked' },
      { label: 'no_ev_connected', value: 'no_ev_connected' },
      { label: 'charge_point_timeout', value: 'charge_point_timeout' },
      { label: 'charging_on_evse_not_allowed', value: 'charging_on_evse_not_allowed' },
      { label: 'remote_start_failed', value: 'remote_start_failed' },
      { label: 'no_user_for_agile_streets', value: 'no_user_for_agile_streets' },
      { label: 'rejected', value: 'rejected' },
      { label: 'canceled_reservation', value: 'canceled_reservation' },
      { label: 'evse_occupied', value: 'evse_occupied' },
      { label: 'evse_inoperative', value: 'evse_inoperative' },
      { label: 'failed', value: 'failed' },
      { label: 'not_supported', value: 'not_supported' },
      { label: 'unknown_reservation', value: 'unknown_reservation' },
      { label: 'ev_not_connect_to_evse', value: 'ev_not_connect_to_evse' },
      { label: 'authorization_failed', value: 'authorization_failed' },
      { label: 'unknown_session', value: 'unknown_session' }
      ],
    },
  }),

  filter__chargePointBootNotificationSerialNumber: Property.ShortText({
    displayName: 'Filter - Charge Point Boot Notification Serial Number',
    description: 'Only list sessions on Charge Points with last boot notification that had this charge_point_serial_number',
    required: false,
  }),

  filter__chargePointBootNotificationVendor: Property.ShortText({
    displayName: 'Filter - Charge Point Boot Notification Vendor',
    description: 'Only list sessions on Charge Points with last boot notification that had this vendor',
    required: false,
  }),

  filter__startedAfter: Property.DateTime({
    displayName: 'Filter - Started After',
    description: 'Only list sessions identified by the start time being after this datetime',
    required: false,
  }),

  filter__startedBefore: Property.DateTime({
    displayName: 'Filter - Started Before',
    description: 'Only list sessions identified by the start time being before this datetime',
    required: false,
  }),

  filter__userId: Property.Number({
    displayName: 'Filter - User Id',
    description: 'Only list sessions by a certain user',
    required: false,
  }),

  filter__status: Property.StaticDropdown({
    displayName: 'Filter - Status',
    description: 'Only list session in this status',
    required: false,
    options: {
      options: [
      { label: 'unknown', value: 'unknown' },
      { label: 'pending', value: 'pending' },
      { label: 'active', value: 'active' },
      { label: 'finished', value: 'finished' },
      { label: 'expired', value: 'expired' },
      { label: 'failed', value: 'failed' }
      ],
    },
  }),

  filter__endedAfter: Property.DateTime({
    displayName: 'Filter - Ended After',
    description: 'Only list sessions identified by the end time being after this datetime',
    required: false,
  }),

  filter__endedBefore: Property.DateTime({
    displayName: 'Filter - Ended Before',
    description: 'Only list sessions identified by the end time being before this datetime',
    required: false,
  }),

  filter__partnerId: Property.Number({
    displayName: 'Filter - Partner Id',
    description: 'Only list sessions associated with a certain partner',
    required: false,
  }),

  filter__subOperatorId: Property.Number({
    displayName: 'Filter - Sub Operator Id',
    description: 'Only list sessions associated with partners, assigned to certain sub-operator',
    required: false,
  }),

  filter__idTag: Property.ShortText({
    displayName: 'Filter - Id Tag',
    description: `Only list sessions started with a specific idTag (RFID identifier or remote start identifier)\nA remote start identifier has the format \`*XXXXXXX\` where the \`XXXXXXX\` is the session id padded with \`0\`s on the left\n`,
    required: false,
  }),

  filter__paymentType: Property.StaticDropdown({
    displayName: 'Filter - Payment Type',
    description: '`bank_transfer` is used for one-time bank transfers, for saved (tokenized) bank transfers use `tokenized`.',
    required: false,
    options: {
      options: [
      { label: 'tokenized', value: 'tokenized' },
      { label: 'subscription', value: 'subscription' },
      { label: 'balance', value: 'balance' },
      { label: 'corporate', value: 'corporate' },
      { label: 'terminal', value: 'terminal' },
      { label: 'bank_transfer', value: 'bank_transfer' }
      ],
    },
  }),

  filter__paymentStatus: Property.StaticDropdown({
    displayName: 'Filter - Payment Status',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'pending', value: 'pending' },
      { label: 'paid', value: 'paid' },
      { label: 'partially', value: 'partially' },
      { label: 'failed', value: 'failed' }
      ],
    },
  }),

  filter__taxId: Property.Number({
    displayName: 'Filter - Tax Id',
    description: 'Only list sessions with specific VAT id',
    required: false,
  }),

  filter__paymentStatusUpdatedBefore: Property.DateTime({
    displayName: 'Filter - Payment Status Updated Before',
    description: 'Only list sessions with payment status updated before the specified date and time. Please provide the value in ISO 8601 formatted date.',
    required: false,
  }),

  filter__paymentStatusUpdatedAfter: Property.DateTime({
    displayName: 'Filter - Payment Status Updated After',
    description: 'Only list sessions with payment status updated after the specified date and time. Please provide the value in ISO 8601 formatted date.',
    required: false,
  }),

  filter__externalAppData: Property.ShortText({
    displayName: 'Filter - External App Data',
    description: 'Only list records with specific external application data. You can use a dot notation to search for nested properties. For example, `filter[externalAppData.property1.property2]=value`.',
    required: false,
  }),

  filter__receiptId: Property.Number({
    displayName: 'Filter - Receipt Id',
    description: 'Only list sessions with specific receipt id.',
    required: false,
  }),

  filter__authorizationSource: Property.StaticDropdown({
    displayName: 'Filter - Authorization Source',
    description: 'Filter sessions based on authorization source',
    required: false,
    options: {
      options: [
      { label: 'roaming', value: 'roaming' },
      { label: 'local', value: 'local' },
      { label: 'third_party', value: 'third_party' }
      ],
    },
  }),

  filter__billingStatus: Property.StaticDropdown({
    displayName: 'Filter - Billing Status',
    description: 'Only list sessions in this billing status.',
    required: false,
    options: {
      options: [
      { label: 'pending', value: 'pending' },
      { label: 'suspended', value: 'suspended' },
      { label: 'completed', value: 'completed' },
      { label: 'null', value: 'null' }
      ],
    },
  }),

  filter__terminalId: Property.Number({
    displayName: 'Filter - Terminal Id',
    description: 'Only list sessions with transaction(s) with specific payment terminal id.',
    required: false,
  }),

  filter__lastUpdatedAfter: Property.DateTime({
    displayName: 'Filter - Last Updated After',
    description: 'ISO 8601 formatted date. Lists only the specific resource that was last updated on and after this datetime',
    required: false,
  }),

  filter__lastUpdatedBefore: Property.DateTime({
    displayName: 'Filter - Last Updated Before',
    description: 'ISO 8601 formatted date. Lists only the specific resource that was last updated on and before this datetime',
    required: false,
  }),

  filter__roaming__roamingOperatorCpoIds: Property.Array({
    displayName: 'Filter - Roaming - Roaming Operator Cpo Ids',
    description: 'Only list sessions initiated on the EVSEs of a specific Roaming operator with a CPO role.',
    required: false,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'externalAppData', value: 'externalAppData' }
      ],
    },
  }),
    per_page: Property.Number({
      displayName: 'Per page',
      description: 'When pagination is enabled: maximum total results across all pages. When pagination is disabled: number of results per API request (max 100).',
      required: false,
      defaultValue: 100,
    }),
    usePagination: Property.Checkbox({
      displayName: 'Paginate Results',
      description: 'Whether to automatically paginate to fetch all results',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context): Promise<SessionsListingResponse> {
    try {
      const url = processPathParameters('/public-api/resources/sessions/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['withClockAlignedEnergyConsumption', 'clockAlignedInterval', 'withAuthorization', 'withPriceBreakdown', 'withChargingPeriods', 'withChargingPeriodsPriceBreakdown', 'filter', 'page', 'per_page', 'cursor', 'include']);
      
      const body = undefined;

          if (context.propsValue.usePagination) {
      return await paginate({
        auth: context.auth,
        method: 'GET',
        path: url,
        queryParams,
        body,
        perPage: context.propsValue.per_page ?? 100,
        dataPath: 'data',
      }) as SessionsListingResponse;
    }

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.GET,
        body,
        queryParams
      ) as SessionsListingResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
