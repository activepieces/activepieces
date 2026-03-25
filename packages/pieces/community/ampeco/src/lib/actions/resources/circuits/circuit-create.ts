import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { CircuitCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/circuits/v2.0

export const circuitCreateAction = createAction({
  auth: ampecoAuth,
  name: 'circuitCreate',
  displayName: 'Resources - Circuits - Create',
  description: 'Create a new circuit.',
  props: {
        
  name: Property.ShortText({
    displayName: 'Name',
    description: '',
    required: true,
  }),

  parentCircuitId: Property.Number({
    displayName: 'Parent Circuit Id',
    description: `Specify parent circuit in Multi-level DLM. Circuits used in flexibility assets or using load balancing integration can not be used in Multi-level DLM.\n`,
    required: false,
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
    description: `\`R\` stands for \`L1\`, </br>\n\`S\` - for \`L2\` </br>\n\`T\` - for \`L3\` </br>\nSo for example \`RST\` = \`L1\`, \`L2\`, \`L3\`, while \`RTS\` = \`L1\`, \`L3\`, \`L2\`, etc. </br>\nThe field is mandatory for Multi-level DLM when the \`phases\` value  is \`three_phase\`.\n`,
    required: false,
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
    description: `Specifies the active line conductors used in the circuit. </br>\nSingle phase values (\`phases\` = \`single_phase\`): \`L1\`, \`L2\`, \`L3\` - Valid in \`star\` electrical configuration </br>\nSplit phase values (\`phases\` = \`split_phase\`): \`L1_L2\`, \`L2_L3\`, \`L1_L3\` - Valid in \`star\` electrical configuration </br>\nThis field is mandatory for Multi-level DLM when the \`phases\` value is \`single_phase\` or \`split_phase\`.\n`,
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
  }),

  electricalConfiguration: Property.StaticDropdown({
    displayName: 'Electrical Configuration',
    description: 'Defines the type of electrical configuration of the circuit. A circuit must have the same electrical configuration as its parent circuit. To maintain safety and compatibility, only charge points with an identical electrical configuration to the circuit can be added. To modify a circuit\'s electrical configuration, all charge points with a different configuration must first be removed through Actions / Detach Charge Point. The available options are </br> `star` - TN system - Star (Y) (default)</br> `delta` - IT system - Delta (Δ)</br>',
    required: false,
    options: {
      options: [
      { label: 'star', value: 'star' },
      { label: 'delta', value: 'delta' }
      ],
    },
  }),

  maxVoltage: Property.StaticDropdown({
    displayName: 'Max Voltage',
    description: '',
    required: false,
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

  maxCurrent: Property.Number({
    displayName: 'Max Current',
    description: 'The current (A) limit for the whole circuit. This would usually be the circuit breaker rated current.',
    required: true,
  }),

  minChargePointCurrent: Property.Number({
    displayName: 'Min Charge Point Current',
    description: 'Defines what is the lowest current (A) allowed per charge point. New sessions cannot start if any of the existing ones has to be lowered to less than the set minimum rate. This is to ensure that a connected car vehicle actually charge because the vehicles have a minimum charging rate below which they would not accept the charge. If left empty, there is no minimum.',
    required: false,
  }),

  setSessionLimitToZeroOnIdle: Property.StaticDropdown({
    displayName: 'Set Session Limit To Zero On Idle',
    description: 'Sets the limit to 0 when the session enters an idle period.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  electricityMeterId: Property.Number({
    displayName: 'Electricity Meter Id',
    description: 'The ID of the Electricity Meter linked to the circuit (if any).',
    required: false,
  }),

  offlineReservedCurrent: Property.Number({
    displayName: 'Offline Reserved Current',
    description: 'The current (A) reserved for other loads on the circuit (non-managed loads) when the Electricity Meter is offline.',
    required: false,
  }),

  loadBalancingIntegration__id: Property.Number({
    displayName: 'Load Balancing Integration - Id',
    description: 'The id of the load balancing integration (can be found in the Ampeco backend). Provide `null` if you want to disable any load balancing integration and revert back to the Ampeco built-in load balancing.',
    required: false,
  }),

  loadBalancingIntegration__fields_VariantType: Property.StaticDropdown({
    displayName: 'Load Balancing Integration - Fields Variant Type',
    description: 'Select the type of the variant',
    required: true,
    options: {
      options: [
      { label: 'Variant 1', value: '1' },
      { label: 'Variant 2', value: '2' }
      ],
    },
  }),

  loadBalancingIntegration__fields: Property.DynamicProperties({
     displayName: 'Fields',
     auth:ampecoAuth,
     required: true,
     refreshers: ['loadBalancingIntegration__fields_VariantType'],
     props: async ({ loadBalancingIntegration__fields_VariantType }) => {
        if (!loadBalancingIntegration__fields_VariantType) {
           return {};
        }

        type VariantKey = '1' | '2';

        const variantMap = {
          '1': {
  startDate: Property.DateTime({
    displayName: 'Load Balancing Integration - Fields - Start Date',
    description: 'DREEV specific. Reporting and accepting charging schedules will commence at this date.',
    required: false,
  }),}, 
'2': {
  installationId: Property.ShortText({
    displayName: 'Load Balancing Integration - Fields - Installation Id',
    description: 'Zaptec specific. Installation ID inside Zaptec system, used for identifying the corresponding circuit.',
    required: true,
  }),}
        };

        const key = loadBalancingIntegration__fields_VariantType as unknown as string;
        if (key in variantMap) {
           return variantMap[key as VariantKey];
        }
        return {};
     }
  }),
  },
  async run(context): Promise<CircuitCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/circuits/v2.0', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'parentCircuitId', 'phases', 'phaseRotation', 'connectedPhase', 'electricalConfiguration', 'maxVoltage', 'maxCurrent', 'minChargePointCurrent', 'setSessionLimitToZeroOnIdle', 'electricityMeterId', 'offlineReservedCurrent', 'loadBalancingIntegration', 'fields_VariantType']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as CircuitCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
