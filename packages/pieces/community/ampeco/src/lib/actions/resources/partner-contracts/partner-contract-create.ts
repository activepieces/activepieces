import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { PartnerContractCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/partner-contracts/v1.0

export const partnerContractCreateAction = createAction({
  auth: ampecoAuth,
  name: 'partnerContractCreate',
  displayName: 'Resources - Partner Contracts -Create',
  description: 'Create new Partner Contract.',
  props: {
        
  title: Property.ShortText({
    displayName: 'Title',
    description: '',
    required: true,
  }),

  partnerId: Property.Number({
    displayName: 'Partner Id',
    description: '',
    required: true,
  }),

  startDate: Property.DateTime({
    displayName: 'Start Date',
    description: 'The contract is effective from the first of the selected month.',
    required: true,
  }),

  endDate: Property.DateTime({
    displayName: 'End Date',
    description: 'The contract expires at the last day of the selected month. If nothing is selected, there is no expiration date.',
    required: false,
  }),

  autoRenewal: Property.StaticDropdown({
    displayName: 'Auto Renewal',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  accessAndPermissions__sessionsRemoteControl: Property.StaticDropdown({
    displayName: 'Access And Permissions - Sessions Remote Control',
    description: 'Allows the partner to start/stop session, unlock connector, trigger message, set a charging profile and get the composite schedule.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  accessAndPermissions__startReservation: Property.StaticDropdown({
    displayName: 'Access And Permissions - Start Reservation',
    description: 'Allows the partner to make reservations.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  accessAndPermissions__stopReservation: Property.StaticDropdown({
    displayName: 'Access And Permissions - Stop Reservation',
    description: 'Allows the partner to cancel reservations.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  accessAndPermissions__resetChargePoint: Property.StaticDropdown({
    displayName: 'Access And Permissions - Reset Charge Point',
    description: 'Allows the partner to reset charge points.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  accessAndPermissions__firmwareUpdate: Property.StaticDropdown({
    displayName: 'Access And Permissions - Firmware Update',
    description: 'Allows the partner to make firmware updates to the charge points.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  revenueSharing__partnerSharePercentageAcEvse: Property.Number({
    displayName: 'Revenue Sharing - Partner Share Percentage Ac Evse',
    description: '',
    required: false,
  }),

  revenueSharing__partnerSharePercentageDcEvse: Property.Number({
    displayName: 'Revenue Sharing - Partner Share Percentage Dc Evse',
    description: '',
    required: false,
  }),

  revenueSharing__excludeConnectionFee: Property.StaticDropdown({
    displayName: 'Revenue Sharing - Exclude Connection Fee',
    description: 'If the tariff has a Connection fee, this fee would not be included in the revenue sharing with the Partner and will remain entirely for the Operator.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  revenueSharing__deductElectricityCost: Property.StaticDropdown({
    displayName: 'Revenue Sharing - Deduct Electricity Cost',
    description: 'The cost of the electricity would first be deducted from the collected revenue and then the Revenue sharing rules will be applied.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  revenueSharing__reimburseForElectricityCost: Property.StaticDropdown({
    displayName: 'Revenue Sharing - Reimburse For Electricity Cost',
    description: 'If set to true, the Partner would receive not only their share of the revenue but also a reimbursement for the cost of the electricity.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  revenueSharing__fixedFeePerSessionAc: Property.Number({
    displayName: 'Revenue Sharing - Fixed Fee Per Session Ac',
    description: 'Additional flat fee that is applied for every billed session and subtracted from the Partner’s share of the revenue for each session on AC Charging Station.',
    required: false,
  }),

  revenueSharing__fixedFeePerSessionDc: Property.Number({
    displayName: 'Revenue Sharing - Fixed Fee Per Session Dc',
    description: 'Additional flat fee that is applied for every billed session and subtracted from the Partner’s share of the revenue for each session on DC Charging Station.',
    required: false,
  }),

  revenueSharing__feePerKwhAc: Property.Number({
    displayName: 'Revenue Sharing - Fee Per Kwh Ac',
    description: 'Additional flat fee that is applied for every billed kWh and subtracted from the Partner\'s share of the revenue for each kWh billed on AC Charging Station.',
    required: false,
  }),

  revenueSharing__feePerKwhDc: Property.Number({
    displayName: 'Revenue Sharing - Fee Per Kwh Dc',
    description: 'Additional flat fee that is applied for every billed kWh and subtracted from the Partner\'s share of the revenue for each kWh billed on DC Charging Station.',
    required: false,
  }),

  revenueSharing__handlingFee: Property.Number({
    displayName: 'Revenue Sharing - Handling Fee',
    description: 'Additional percentage fee to be applied on the total amount paid by the user for the session. This fee is then subtracted from the Partner\'s share of the revenue. This fee is available only if the feature "Additional Platform Fees" is enabled for the system.',
    required: false,
  }),

  monthlyPlatformFees__perChargePoint: Property.Number({
    displayName: 'Monthly Platform Fees - Per Charge Point',
    description: 'The provided amount should be excluding VAT.',
    required: false,
  }),

  monthlyPlatformFees__perAcEvse: Property.Number({
    displayName: 'Monthly Platform Fees - Per Ac Evse',
    description: 'The provided amount should be excluding VAT.',
    required: false,
  }),

  monthlyPlatformFees__perDcEvse: Property.Number({
    displayName: 'Monthly Platform Fees - Per Dc Evse',
    description: 'The provided amount should be excluding VAT.',
    required: false,
  }),
  },
  async run(context): Promise<PartnerContractCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/partner-contracts/v1.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['title', 'partnerId', 'startDate', 'endDate', 'autoRenewal', 'accessAndPermissions', 'revenueSharing', 'monthlyPlatformFees']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as PartnerContractCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
