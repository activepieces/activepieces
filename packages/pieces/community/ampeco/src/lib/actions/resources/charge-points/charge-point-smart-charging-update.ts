import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointSmartChargingUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/charge-points/v2.0/{chargePoint}/smart-charging

export const chargePointSmartChargingUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointSmartChargingUpdate',
  displayName: 'Resources - Charge Points - Charge Point Smart Charging Update',
  description: 'Update smart charging details for the charge point.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  mode: Property.StaticDropdown({
    displayName: 'Mode',
    description: 'Select the mode',
    required: true,
    options: {
      options: [
      { label: 'tod', value: 'tod' },
      { label: 'dynamic', value: 'dynamic' },
      { label: 'user_schedule', value: 'user_schedule' },
      { label: 'disabled', value: 'disabled' }
      ],
    },
  }),

  requestBody: Property.DynamicProperties({
     displayName: 'Request Body',
     required: true,
     auth:ampecoAuth,
     refreshers: ['mode'],
     props: async ({ mode }) => {
        if (!mode) {
           return {};
        }

        type VariantKey = 'tod' | 'dynamic' | 'user_schedule' | 'disabled';

        const variantMap = {
          'tod': {
  defaultChargePointMaxCurrent: Property.Number({
    displayName: 'Default Charge Point Max Current',
    description: 'In amps. The max current would be used in the algorithm for the smart charging and wherever there is not a max current explicitly set.',
    required: true,
  }),

  periods: Property.Array({
    displayName: 'Periods',
    description: 'The time period must be the same for every single day through the week and should be always 60 min. The `startAt` and `endAt` must comply with this restriction.',
    required: false,
    properties: { 
         
  weekDay: Property.StaticDropdown({
    displayName: 'Week Day',
    description: 'Specify the day for which the pricing would be valid.',
    required: true,
    options: {
      options: [
      { label: 'all', value: 'all' },
      { label: 'mon', value: 'mon' },
      { label: 'tue', value: 'tue' },
      { label: 'wed', value: 'wed' },
      { label: 'thu', value: 'thu' },
      { label: 'fri', value: 'fri' },
      { label: 'sat', value: 'sat' },
      { label: 'sun', value: 'sun' }
      ],
    },
  }),

  elements: Property.Json({
    displayName: 'Elements',
    defaultValue:{
  "type": "array",
  "items": {
    "type": "object",
    "required": [
      "startAt",
      "endAt"
    ],
    "properties": {
      "startAt": {
        "type": "string",
        "format": "time",
        "example": "00:00",
        "description": "The 24-hour format should be used.</br>\nExample '00:00'\n"
      },
      "endAt": {
        "type": "string",
        "format": "time",
        "example": "00:00",
        "description": "The 24-hour format should be used.</br>\nExample '01:00'\n"
      },
      "maxCurrent": {
        "type": "number",
        "nullable": true
      }
    }
  }
},
    required: true,
  }), 
    },
  }),

  preconditioningTime: Property.Number({
    displayName: 'Preconditioning Time',
    description: 'The time in minutes before departure when the charging will be performed with full power.',
    required: false,
  }),

  minCurrent: Property.Number({
    displayName: 'Min Current',
    description: 'minCurrent is always REQUIRED for `user_controlled_schedule`.',
    required: false,
  }),

  enableKeepAwake: Property.StaticDropdown({
    displayName: 'Enable Keep Awake',
    description: 'For personal charge points. Keep the car awake during scheduled periods by continuously charging at a low current / power.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  maxVoltage: Property.StaticDropdown({
    displayName: 'Max Voltage',
    description: '',
    required: true,
    options: {
      options: [
      { label: '230', value: '230' },
      { label: '380', value: '380' },
      { label: '400', value: '400' },
      { label: '480', value: '480' },
      { label: '120', value: '120' },
      { label: '208', value: '208' },
      { label: '240', value: '240' },
      { label: '110-130', value: '110-130' },
      { label: '220-240', value: '220-240' }
      ],
    },
  }),

  electricalConfiguration: Property.StaticDropdown({
    displayName: 'Electrical Configuration',
    description: 'Defines the type of electrical configuration of the charge point. The available options are </br> `star` - TN system - Star (Y) (default)</br> `delta` - IT system - Delta (Δ)</br>.',
    required: false,
    options: {
      options: [
      { label: 'star', value: 'star' },
      { label: 'delta', value: 'delta' }
      ],
    },
  }),

  phases: Property.StaticDropdown({
    displayName: 'Phases',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'single_phase', value: 'single_phase' },
      { label: 'three_phase', value: 'three_phase' },
      { label: 'split_phase', value: 'split_phase' }
      ],
    },
  }),

  phaseRotation: Property.StaticDropdown({
    displayName: 'Phase Rotation',
    description: '`R` stands for `L1`, </br> `S` - for `L2` </br> `T` - for `L3` </br> So for example `RST` = `L1`, `L2`, `L3`, while `RTS` = `L1`, `L3`, `L2`, etc.',
    required: true,
    options: {
      options: [
      { label: 'RST', value: 'RST' },
      { label: 'RTS', value: 'RTS' },
      { label: 'SRT', value: 'SRT' },
      { label: 'STR', value: 'STR' },
      { label: 'TRS', value: 'TRS' },
      { label: 'TSR', value: 'TSR' }
      ],
    },
  }),

  connectedPhase: Property.StaticDropdown({
    displayName: 'Connected Phase',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'L1', value: 'L1' },
      { label: 'L2', value: 'L2' },
      { label: 'L3', value: 'L3' },
      { label: 'L1_L2', value: 'L1_L2' },
      { label: 'L1_L3', value: 'L1_L3' },
      { label: 'L2_L3', value: 'L2_L3' }
      ],
    },
  }),}, 
'dynamic': {
  defaultChargePointMaxCurrent: Property.Number({
    displayName: 'Default Charge Point Max Current',
    description: 'In amps. The max current would be used in the algorithm for the smart charging and wherever there is not a max current explicitly set.',
    required: true,
  }),

  preconditioningTime: Property.Number({
    displayName: 'Preconditioning Time',
    description: 'The time in minutes before departure when the charging will be performed with full power.',
    required: false,
  }),

  minCurrent: Property.Number({
    displayName: 'Min Current',
    description: 'minCurrent is always REQUIRED for `user_controlled_schedule`.',
    required: false,
  }),

  enableKeepAwake: Property.StaticDropdown({
    displayName: 'Enable Keep Awake',
    description: 'For personal charge points. Keep the car awake during scheduled periods by continuously charging at a low current / power.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  maxVoltage: Property.StaticDropdown({
    displayName: 'Max Voltage',
    description: '',
    required: true,
    options: {
      options: [
      { label: '230', value: '230' },
      { label: '380', value: '380' },
      { label: '400', value: '400' },
      { label: '480', value: '480' },
      { label: '120', value: '120' },
      { label: '208', value: '208' },
      { label: '240', value: '240' },
      { label: '110-130', value: '110-130' },
      { label: '220-240', value: '220-240' }
      ],
    },
  }),

  electricalConfiguration: Property.StaticDropdown({
    displayName: 'Electrical Configuration',
    description: 'Defines the type of electrical configuration of the charge point. The available options are </br> `star` - TN system - Star (Y) (default)</br> `delta` - IT system - Delta (Δ)</br>.',
    required: false,
    options: {
      options: [
      { label: 'star', value: 'star' },
      { label: 'delta', value: 'delta' }
      ],
    },
  }),

  phases: Property.StaticDropdown({
    displayName: 'Phases',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'single_phase', value: 'single_phase' },
      { label: 'three_phase', value: 'three_phase' },
      { label: 'split_phase', value: 'split_phase' }
      ],
    },
  }),

  phaseRotation: Property.StaticDropdown({
    displayName: 'Phase Rotation',
    description: '`R` stands for `L1`, </br> `S` - for `L2` </br> `T` - for `L3` </br> So for example `RST` = `L1`, `L2`, `L3`, while `RTS` = `L1`, `L3`, `L2`, etc.',
    required: true,
    options: {
      options: [
      { label: 'RST', value: 'RST' },
      { label: 'RTS', value: 'RTS' },
      { label: 'SRT', value: 'SRT' },
      { label: 'STR', value: 'STR' },
      { label: 'TRS', value: 'TRS' },
      { label: 'TSR', value: 'TSR' }
      ],
    },
  }),

  connectedPhase: Property.StaticDropdown({
    displayName: 'Connected Phase',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'L1', value: 'L1' },
      { label: 'L2', value: 'L2' },
      { label: 'L3', value: 'L3' },
      { label: 'L1_L2', value: 'L1_L2' },
      { label: 'L1_L3', value: 'L1_L3' },
      { label: 'L2_L3', value: 'L2_L3' }
      ],
    },
  }),}, 
'user_schedule': {
  defaultChargePointMaxCurrent: Property.Number({
    displayName: 'Default Charge Point Max Current',
    description: 'In amps. The max current would be used in the algorithm for the smart charging and wherever there is not a max current explicitly set.',
    required: true,
  }),

  preconditioningTime: Property.Number({
    displayName: 'Preconditioning Time',
    description: 'The time in minutes before departure when the charging will be performed with full power.',
    required: false,
  }),

  minCurrent: Property.Number({
    displayName: 'Min Current',
    description: 'minCurrent is always REQUIRED for `user_controlled_schedule`.',
    required: true,
  }),

  enableKeepAwake: Property.StaticDropdown({
    displayName: 'Enable Keep Awake',
    description: 'For personal charge points. Keep the car awake during scheduled periods by continuously charging at a low current / power.',
    required: true,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  maxVoltage: Property.StaticDropdown({
    displayName: 'Max Voltage',
    description: '',
    required: true,
    options: {
      options: [
      { label: '230', value: '230' },
      { label: '380', value: '380' },
      { label: '400', value: '400' },
      { label: '480', value: '480' },
      { label: '120', value: '120' },
      { label: '208', value: '208' },
      { label: '240', value: '240' },
      { label: '110-130', value: '110-130' },
      { label: '220-240', value: '220-240' }
      ],
    },
  }),

  electricalConfiguration: Property.StaticDropdown({
    displayName: 'Electrical Configuration',
    description: 'Defines the type of electrical configuration of the charge point. The available options are </br> `star` - TN system - Star (Y) (default)</br> `delta` - IT system - Delta (Δ)</br>.',
    required: false,
    options: {
      options: [
      { label: 'star', value: 'star' },
      { label: 'delta', value: 'delta' }
      ],
    },
  }),

  phases: Property.StaticDropdown({
    displayName: 'Phases',
    description: '',
    required: true,
    options: {
      options: [
      { label: 'single_phase', value: 'single_phase' },
      { label: 'three_phase', value: 'three_phase' },
      { label: 'split_phase', value: 'split_phase' }
      ],
    },
  }),

  phaseRotation: Property.StaticDropdown({
    displayName: 'Phase Rotation',
    description: '`R` stands for `L1`, </br> `S` - for `L2` </br> `T` - for `L3` </br> So for example `RST` = `L1`, `L2`, `L3`, while `RTS` = `L1`, `L3`, `L2`, etc.',
    required: true,
    options: {
      options: [
      { label: 'RST', value: 'RST' },
      { label: 'RTS', value: 'RTS' },
      { label: 'SRT', value: 'SRT' },
      { label: 'STR', value: 'STR' },
      { label: 'TRS', value: 'TRS' },
      { label: 'TSR', value: 'TSR' }
      ],
    },
  }),

  allowDynamicLoadManagement: Property.StaticDropdown({
    displayName: 'Allow Dynamic Load Management',
    description: 'When selected, the Charge Point can be added to a DLM circuit.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  connectedPhase: Property.StaticDropdown({
    displayName: 'Connected Phase',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'L1', value: 'L1' },
      { label: 'L2', value: 'L2' },
      { label: 'L3', value: 'L3' },
      { label: 'L1_L2', value: 'L1_L2' },
      { label: 'L1_L3', value: 'L1_L3' },
      { label: 'L2_L3', value: 'L2_L3' }
      ],
    },
  }),}, 
'disabled': {
  preconditioningTime: Property.Number({
    displayName: 'Preconditioning Time',
    description: 'The time in minutes before departure when the charging will be performed with full power.',
    required: false,
  }),}
        };

        const key = mode as unknown as string;
        if (key in variantMap) {
           return variantMap[key as VariantKey];
        }
        return {};
     }
  }),
  },
  async run(context): Promise<ChargePointSmartChargingUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/smart-charging', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['mode', 'defaultChargePointMaxCurrent', 'periods', 'preconditioningTime', 'minCurrent', 'enableKeepAwake', 'maxVoltage', 'electricalConfiguration', 'phases', 'phaseRotation', 'connectedPhase', 'allowDynamicLoadManagement']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointSmartChargingUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
