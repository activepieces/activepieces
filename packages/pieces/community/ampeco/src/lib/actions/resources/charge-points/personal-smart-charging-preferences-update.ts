import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { PersonalSmartChargingPreferencesUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/charge-points/v2.0/{chargePoint}/personal-smart-charging-preferences

export const personalSmartChargingPreferencesUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'personalSmartChargingPreferencesUpdate',
  displayName: 'Resources - Charge Points - Personal Smart Charging Preferences Update',
  description: 'Update personal smart charging preferences.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    description: '',
    required: true,
  }),

  requestBody_VariantType: Property.StaticDropdown({
    displayName: 'Request Body Variant Type',
    description: 'Select the type of the variant',
    required: true,
    options: {
      options: [
      { label: 'User controlled schedule', value: '1' },
      { label: 'Solar', value: '2' },
      { label: 'Octopus Agile', value: '3' },
      { label: 'Octopus Go', value: '4' },
      { label: 'Energi Elspot', value: '5' },
      { label: 'NordPool', value: '6' },
      { label: 'Electricity rate', value: '7' },
      { label: 'Disabled', value: '8' }
      ],
    },
  }),

  requestBody: Property.DynamicProperties({
     displayName: 'Request Body',
     required: true,
     auth:ampecoAuth,
     refreshers: ['requestBody_VariantType'],
     props: async ({ requestBody_VariantType }) => {
        if (!requestBody_VariantType) {
           return {};
        }

        type VariantKey = '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8';

        const variantMap = {
          '1': {
  enabled: Property.StaticDropdown({
    displayName: 'Enabled',
    description: 'Enable or disable the smart charging from owner preferences.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'user_controlled_schedule', value: 'user_controlled_schedule' }
      ],
    },
  }),

  startTime: Property.ShortText({
    displayName: 'Preferences - Start Time',
    description: 'Start of preferred charging window which will be applied by default when no week day is chosen. Applicable for schedule mode.',
    required: true,
  }),

  endTime: Property.ShortText({
    displayName: 'Preferences - End Time',
    description: 'End of preferred charging window which will be applied by default when no week day is chosen. Applicable for schedule mode.',
    required: true,
  }),

  minTargetChargeKwh: Property.Number({
    displayName: 'Preferences - Target Charge - Min Target Charge Kwh',
    description: '',
    required: false,
  }),

  maxTargetChargeKwh: Property.Number({
    displayName: 'Preferences - Target Charge - Max Target Charge Kwh',
    description: '',
    required: false,
  }),

  priceOffPeak: Property.Number({
    displayName: 'Preferences - Track Electricity Costs - Price Off Peak',
    description: '',
    required: false,
  }),

  pricePeak: Property.Number({
    displayName: 'Preferences - Track Electricity Costs - Price Peak',
    description: '',
    required: false,
  }),

  weekDays: Property.Array({
    displayName: 'Preferences - Week Days',
    description: '',
    required: false,
    properties: { 
         
  days: Property.StaticMultiSelectDropdown({
    displayName: 'Days',
    description: 'Specify the day(s) for which the schedule will apply.',
    required: true,
    options: {
      options: [
      { label: 'monday', value: 'monday' },
      { label: 'tuesday', value: 'tuesday' },
      { label: 'wednesday', value: 'wednesday' },
      { label: 'thursday', value: 'thursday' },
      { label: 'friday', value: 'friday' },
      { label: 'saturday', value: 'saturday' },
      { label: 'sunday', value: 'sunday' }
      ],
    },
  }),

  startTime: Property.ShortText({
    displayName: 'Start Time',
    description: 'Start of preferred charging window for chosen day(s).',
    required: true,
  }),

  endTime: Property.ShortText({
    displayName: 'End Time',
    description: 'End of preferred charging window for chosen day(s).',
    required: true,
  }), 
    },
  }),}, 
'2': {
  enabled: Property.StaticDropdown({
    displayName: 'Enabled',
    description: 'Enable or disable the smart charging from owner preferences.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'solar', value: 'solar' }
      ],
    },
  }),

  maxCurrentFromGrid: Property.Number({
    displayName: 'Preferences - Max Current From Grid',
    description: 'The max current that can be taken from grid to ensure a stable charging process.Recommended options to use 0, 6, 8, 10, 12.',
    required: true,
  }),

  solarStableTime: Property.Number({
    displayName: 'Preferences - Solar Stable Time',
    description: 'Shorter time means more precise solar availability detection but also more frequent charging on/off switching.',
    required: true,
  }),}, 
'3': {
  enabled: Property.StaticDropdown({
    displayName: 'Enabled',
    description: 'Enable or disable the smart charging from owner preferences.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'octopus_agile', value: 'octopus_agile' }
      ],
    },
  }),

  integrationId: Property.Number({
    displayName: 'Integration Id',
    description: '',
    required: true,
  }),

  applicableTaxId: Property.Number({
    displayName: 'Preferences - Applicable Tax Id',
    description: 'The ID of the applicable tax rate. Used to calculate correctly electricity costs shown to the user.',
    required: true,
  }),

  departureTime: Property.ShortText({
    displayName: 'Preferences - Target Charge - Departure Time',
    description: '',
    required: false,
  }),

  preconditioningTime: Property.Number({
    displayName: 'Preferences - Target Charge - Preconditioning Time',
    description: 'The time in minutes before departure when the charging will be performed with full power.',
    required: false,
  }),

  minTargetChargeKwh: Property.Number({
    displayName: 'Preferences - Target Charge - Min Target Charge Kwh',
    description: '',
    required: false,
  }),

  maxTargetChargeKwh: Property.Number({
    displayName: 'Preferences - Target Charge - Max Target Charge Kwh',
    description: '',
    required: false,
  }),

  postCode: Property.ShortText({
    displayName: 'Preferences - Post Code',
    description: 'User\'s postcode. Used to determine the applicable tariff.',
    required: true,
  }),

  priceThreshold: Property.Number({
    displayName: 'Preferences - Price Threshold',
    description: 'The price per kWh threshold below which charging would commence.',
    required: true,
  }),}, 
'4': {
  enabled: Property.StaticDropdown({
    displayName: 'Enabled',
    description: 'Enable or disable the smart charging from owner preferences.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'octopus_go', value: 'octopus_go' }
      ],
    },
  }),

  integrationId: Property.Number({
    displayName: 'Integration Id',
    description: '',
    required: true,
  }),

  applicableTaxId: Property.Number({
    displayName: 'Preferences - Applicable Tax Id',
    description: 'The ID of the applicable tax rate. Used to calculate correctly electricity costs shown to the user.',
    required: true,
  }),

  departureTime: Property.ShortText({
    displayName: 'Preferences - Target Charge - Departure Time',
    description: '',
    required: false,
  }),

  preconditioningTime: Property.Number({
    displayName: 'Preferences - Target Charge - Preconditioning Time',
    description: 'The time in minutes before departure when the charging will be performed with full power.',
    required: false,
  }),

  minTargetChargeKwh: Property.Number({
    displayName: 'Preferences - Target Charge - Min Target Charge Kwh',
    description: '',
    required: false,
  }),

  maxTargetChargeKwh: Property.Number({
    displayName: 'Preferences - Target Charge - Max Target Charge Kwh',
    description: '',
    required: false,
  }),

  postCode: Property.ShortText({
    displayName: 'Preferences - Post Code',
    description: 'User\'s postcode. Used to determine the applicable tariff.',
    required: true,
  }),

  priceThreshold: Property.Number({
    displayName: 'Preferences - Price Threshold',
    description: 'The price per kWh threshold below which charging would commence.',
    required: false,
  }),}, 
'5': {
  enabled: Property.StaticDropdown({
    displayName: 'Enabled',
    description: 'Enable or disable the smart charging from owner preferences.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'energi_elspot', value: 'energi_elspot' }
      ],
    },
  }),

  integrationId: Property.Number({
    displayName: 'Integration Id',
    description: '',
    required: false,
  }),

  location: Property.StaticDropdown({
    displayName: 'Preferences - Location',
    description: 'The price region based on energi elspot prices api.',
    required: true,
    options: {
      options: [
      { label: 'GB1', value: 'GB1' }
      ],
    },
  }),

  departureTime: Property.ShortText({
    displayName: 'Preferences - Target Charge - Departure Time',
    description: '',
    required: true,
  }),

  preconditioningTime: Property.Number({
    displayName: 'Preferences - Target Charge - Preconditioning Time',
    description: 'The time in minutes before departure when the charging will be performed with full power.',
    required: false,
  }),

  targetChargeKwh: Property.Number({
    displayName: 'Preferences - Target Charge - Target Charge Kwh',
    description: '',
    required: true,
  }),}, 
'6': {
  enabled: Property.StaticDropdown({
    displayName: 'Enabled',
    description: 'Enable or disable the smart charging from owner preferences.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'nordpool', value: 'nordpool' }
      ],
    },
  }),

  integrationId: Property.Number({
    displayName: 'Integration Id',
    description: '',
    required: false,
  }),

  location: Property.StaticDropdown({
    displayName: 'Preferences - Location',
    description: 'The price region based on energi elspot prices api.',
    required: true,
    options: {
      options: [
      { label: 'GB1', value: 'GB1' }
      ],
    },
  }),

  departureTime: Property.ShortText({
    displayName: 'Preferences - Target Charge - Departure Time',
    description: '',
    required: true,
  }),

  preconditioningTime: Property.Number({
    displayName: 'Preferences - Target Charge - Preconditioning Time',
    description: 'The time in minutes before departure when the charging will be performed with full power.',
    required: false,
  }),

  targetChargeKwh: Property.Number({
    displayName: 'Preferences - Target Charge - Target Charge Kwh',
    description: '',
    required: true,
  }),}, 
'7': {
  enabled: Property.StaticDropdown({
    displayName: 'Enabled',
    description: 'Enable or disable the smart charging from owner preferences.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'charger_electricity_rate', value: 'charger_electricity_rate' }
      ],
    },
  }),

  electricityRateId: Property.Number({
    displayName: 'Electricity Rate Id',
    description: '',
    required: true,
  }),

  solar: Property.StaticDropdown({
    displayName: 'Preferences - Solar',
    description: 'This boolean adds solar mode control for specific brands of chargers that are supported. E.g.: Some chargers support special keys in the charging profile which enables solar charging mode.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  startTime: Property.ShortText({
    displayName: 'Preferences - Start Time',
    description: 'Start of preferred charging window which will be applied by default when no week day is chosen.',
    required: true,
  }),

  endTime: Property.ShortText({
    displayName: 'Preferences - End Time',
    description: 'End of preferred charging window which will be applied by default when no week day is chosen.',
    required: true,
  }),

  departureTime: Property.ShortText({
    displayName: 'Preferences - Target Charge - Departure Time',
    description: '',
    required: true,
  }),

  preconditioningTime: Property.Number({
    displayName: 'Preferences - Target Charge - Preconditioning Time',
    description: 'The time in minutes before departure when the charging will be performed with full power.',
    required: false,
  }),

  targetChargeKwh: Property.Number({
    displayName: 'Preferences - Target Charge - Target Charge Kwh',
    description: 'The desired charge energy which will be achieved with the most optimal price.',
    required: true,
  }),

  weekDays: Property.Array({
    displayName: 'Preferences - Week Days',
    description: '',
    required: false,
    properties: { 
         
  days: Property.StaticMultiSelectDropdown({
    displayName: 'Days',
    description: 'Specify the day(s) for which the schedule will apply.',
    required: true,
    options: {
      options: [
      { label: 'monday', value: 'monday' },
      { label: 'tuesday', value: 'tuesday' },
      { label: 'wednesday', value: 'wednesday' },
      { label: 'thursday', value: 'thursday' },
      { label: 'friday', value: 'friday' },
      { label: 'saturday', value: 'saturday' },
      { label: 'sunday', value: 'sunday' }
      ],
    },
  }),

  startTime: Property.ShortText({
    displayName: 'Start Time',
    description: 'Start of preferred charging window for chosen day(s).',
    required: true,
  }),

  endTime: Property.ShortText({
    displayName: 'End Time',
    description: 'End of preferred charging window for chosen day(s).',
    required: true,
  }), 
    },
  }),}, 
'8': {
  enabled: Property.StaticDropdown({
    displayName: 'Enabled',
    description: 'Disable the smart charging from owner preferences.',
    required: true,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),}
        };

        const key = requestBody_VariantType as unknown as string;
        if (key in variantMap) {
           return variantMap[key as VariantKey];
        }
        return {};
     }
  }),
  },
  async run(context): Promise<PersonalSmartChargingPreferencesUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/personal-smart-charging-preferences', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['requestBody_VariantType', 'enabled', 'type', 'startTime', 'endTime', 'minTargetChargeKwh', 'maxTargetChargeKwh', 'priceOffPeak', 'pricePeak', 'weekDays', 'maxCurrentFromGrid', 'solarStableTime', 'integrationId', 'applicableTaxId', 'departureTime', 'preconditioningTime', 'postCode', 'priceThreshold', 'location', 'targetChargeKwh', 'electricityRateId', 'solar']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as PersonalSmartChargingPreferencesUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
