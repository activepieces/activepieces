import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointEvseCreateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

// Endpoint: POST /public-api/resources/charge-points/v2.0/{chargePoint}/evses

export const chargePointEvseCreateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointEvseCreate',
  displayName: 'Resources - Charge Points - Charge Point Evse Create',
  description: 'Create new EVSE within the Charge Point.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  physicalReference: Property.ShortText({
    displayName: 'Physical Reference',
    description: 'The identifier that is presented to the users, so they can identify the EVSE at the location.',
    required: true,
  }),

  currentType: Property.StaticDropdown({
    displayName: 'Current Type',
    description: `Type of current available on the EVSE:\n- **ac**: Alternating Current (AC) charging\n- **dc**: Direct Current (DC) fast charging\n`,
    required: true,
    options: {
      options: [
      { label: 'ac', value: 'ac' },
      { label: 'dc', value: 'dc' }
      ],
    },
  }),

  label: Property.ShortText({
    displayName: 'Label',
    description: 'The EVSE label will be exposed and visualized in the mobile application',
    required: false,
  }),

  networkId: Property.ShortText({
    displayName: 'Network Id',
    description: 'The OCPP evse identifier (should be consecutive numbers starting from 1)',
    required: true,
  }),

  status: Property.StaticDropdown({
    displayName: 'Status',
    description: 'For roaming EVSEs the status can only be updated if the option for manual management of EVSEs is enabled for the roaming CPO.',
    required: true,
    options: {
      options: [
      { label: 'enabled', value: 'enabled' },
      { label: 'disabled', value: 'disabled' },
      { label: 'out of order', value: 'out of order' }
      ],
    },
  }),

  midMeterCertificationEndYear: Property.Number({
    displayName: 'Mid Meter Certification End Year',
    description: 'The mid meter certification end year.',
    required: false,
  }),

  tariffGroupId: Property.Number({
    displayName: 'Tariff Group Id',
    description: 'The ID of the tariff group attached to the EVSE. If the EVSE is not roaming and tariffGroupId is not specified, the default (free) tariff will be assigned. For roaming EVSEs the Tariff Group can only be updated if the option for manual management of EVSEs is enabled for the roaming CPO.',
    required: false,
  }),

  allowsReservation: Property.StaticDropdown({
    displayName: 'Allows Reservation',
    description: 'Manages whether reservations are allowed on this EVSE. Requires the Reservations to be activated for the system in order to enable for the EVSE.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  bookingEnabled: Property.StaticDropdown({
    displayName: 'Booking Enabled',
    description: 'Indicates if the EVSE can be booked. Requires the Bookings to be activated for the operator and automatically enables allowsReservation when set to true.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  powerOptions__maxPower: Property.Number({
    displayName: 'Power Options - Max Power',
    description: 'in Wh.',
    required: false,
  }),

  powerOptions__maxVoltage: Property.StaticDropdown({
    displayName: 'Power Options - Max Voltage',
    description: 'The maxVoltage of a charge point can fluctuate. Hence, when creating a charge point in the system, the maxVoltage is given as a range. For OCPI purposes it maps as follows: 220-240 = 230 110-130 = 120 400 = 400 380 = 380.',
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

  powerOptions__maxAmperage: Property.Number({
    displayName: 'Power Options - Max Amperage',
    description: '',
    required: false,
  }),

  powerOptions__phases: Property.StaticDropdown({
    displayName: 'Power Options - Phases',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'single_phase', value: 'single_phase' },
      { label: 'three_phase', value: 'three_phase' },
      { label: 'split_phase', value: 'split_phase' }
      ],
    },
  }),

  powerOptions__phaseRotation: Property.StaticDropdown({
    displayName: 'Power Options - Phase Rotation',
    description: '`R` stands for `L1`, </br> `S` - for `L2` </br> `T` - for `L3` </br> So for example `RST` = `L1`, `L2`, `L3`, while `RTS` = `L1`, `L3`, `L2`, etc.',
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

  powerOptions__connectedPhase: Property.StaticDropdown({
    displayName: 'Power Options - Connected Phase',
    description: 'Specifies the active line conductors used in the circuit. - `L1_L2` - Valid when `phases` = `split_phase` in electrical configuration `star` or `phases` = `single_phase` in electrical configuration `delta` - `L2_L3` - Valid when `phases` = `split_phase` in electrical configuration `star` or `phases` = `single_phase` in electrical configuration `delta` - `L1_L3` - Valid when `phases` = `split_phase` in electrical configuration `star` or `phases` = `single_phase` in electrical configuration `delta` - `L1` - Valid when `phases` = `single_phase` in electrical configuration `star` - `L2` - Valid when `phases` = `single_phase` in electrical configuration `star` - `L3` - Valid when `phases` = `single_phase` in electrical configuration `star`.',
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

  externalId: Property.ShortText({
    displayName: 'External Id',
    description: '',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointEvseCreateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}/evses', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, []);
      
      const body = prepareRequestBody(context.propsValue,
        ['physicalReference', 'currentType', 'label', 'networkId', 'status', 'midMeterCertificationEndYear', 'tariffGroupId', 'allowsReservation', 'bookingEnabled', 'powerOptions', 'externalId']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.POST,
        body,
        queryParams
      ) as ChargePointEvseCreateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
