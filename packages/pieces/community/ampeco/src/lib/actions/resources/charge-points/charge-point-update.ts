import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { ampecoAuth } from '../../../common/auth';
import { handleApiError, makeAmpecoApiCall, prepareQueryParams, prepareRequestBody, processPathParameters } from '../../../common/utils';
import { ChargePointUpdateResponse } from '../../../models/responses';

/**
 * Generated from API version: 3.96.4
 */

//Endpoint: PATCH /public-api/resources/charge-points/v2.0/{chargePoint}

export const chargePointUpdateAction = createAction({
  auth: ampecoAuth,
  name: 'chargePointUpdate',
  displayName: 'Resources - Charge Points - Charge Point Update',
  description: 'Update a charge point.',
  props: {
        
  chargePoint: Property.Number({
    displayName: 'Charge Point',
    required: true,
  }),

  include: Property.StaticMultiSelectDropdown({
    displayName: 'Include',
    required: false,
    options: {
      options: [
      { label: 'lastBootNotification', value: 'lastBootNotification' },
      { label: 'chargingProfile', value: 'chargingProfile' },
      { label: 'smartCharging', value: 'smartCharging' },
      { label: 'smartChargingPreferences', value: 'smartChargingPreferences' },
      { label: 'personalSmartChargingPreferences', value: 'personalSmartChargingPreferences' },
      { label: 'availablePersonalSmartChargingModes', value: 'availablePersonalSmartChargingModes' }
      ],
    },
  }),

  name: Property.ShortText({
    displayName: 'Name',
    required: false,
  }),

  type: Property.StaticDropdown({
    displayName: 'Type',
    description: `\`public\` - a charge point visible on the map to everybody </br>\n\`private\` - by default hidden from the map and for private usage only - company and their employees for example. The visibility of the charge point could be managed in partner object, with the different options for accessType. </br>\n\`personal\` - the charge point could have a single owner only. The owner is set when the user claims the charger or with Actions / Change Owner. </br>\n`,
    required: false,
    options: {
      options: [
      { label: 'private', value: 'private' },
      { label: 'public', value: 'public' },
      { label: 'personal', value: 'personal' }
      ],
    },
  }),

  pin: Property.ShortText({
    displayName: 'Pin',
    description: `Required if \`accessType\` is \`personal\`. The PIN should be provided in the mobile app when the charge point is claimed by a user. Should contain only numbers.\n`,
    required: false,
  }),

  locationId: Property.Number({
    displayName: 'Location Id',
    description: `Required if \`accessType\` is \`public\` or \`private\`. NOT required if \`accessType\` is \`personal\`.\n`,
    required: false,
  }),

  chargingZoneId: Property.Number({
    displayName: 'Charging Zone Id',
    required: false,
  }),

  electricityRateId: Property.Number({
    displayName: 'Electricity Rate Id',
    description: `If there is Electricity rate set to the Charge point the electricity cost for each charging session would be tracked. Dynamic electricity rates could not be selected, only ones created in the resource / electricity-rate.\n`,
    required: false,
  }),

  subscription__required: Property.StaticDropdown({
    displayName: 'Subscription - Required',
    description: 'Only for personal charge points. Require an active subscription to use the charge point.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  subscription__planIds: Property.Array({
    displayName: 'Subscription - Plan Ids',
    description: 'Only for personal charge points. List of subscription plans for any of which the user should have an active subscription, to be able to use the charge point.',
    required: false,
  }),

  networkType: Property.StaticDropdown({
    displayName: 'Network Type',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'cellular', value: 'cellular' },
      { label: 'ethernet', value: 'ethernet' },
      { label: 'wlan', value: 'wlan' }
      ],
    },
  }),

  status: Property.StaticDropdown({
    displayName: 'Status',
    description: `Shows the system status of the Charge Point.\n  * \`enabled\` - the charge point is fully operative.\n  * \`disabled\` - the charge point would not be shown on the map if it is a commercial public or commercial private with the relevant option for visibility nor could be claimed or found by ID if it is personal (home). </br>\n  * \`demo\` - acts as a simulator so different setups could be tested.\n  * \`out of order\` - the charge point is visible and shared with users, but a charging session\n`,
    required: false,
    options: {
      options: [
      { label: 'enabled', value: 'enabled' },
      { label: 'disabled', value: 'disabled' },
      { label: 'out of order', value: 'out of order' },
      { label: 'demo', value: 'demo' }
      ],
    },
  }),

  managedByOperator: Property.StaticDropdown({
    displayName: 'Managed By Operator',
    description: `This flag indicates whether the operator can actively manage the charge point. If the flag is set to 'false' the charge point can still be shown to users, but they can't request to start a session on it.\n\nDeprecated. Please use \`communicationMode\` instead. The \`communicationMode\` can only be set when creating a charge point.\n`,
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  externalId: Property.ShortText({
    displayName: 'External Id',
    required: false,
  }),

  network__id: Property.ShortText({
    displayName: 'Network - Id',
    description: 'OCPP Identifier.',
    required: false,
  }),

  network__protocol: Property.StaticDropdown({
    displayName: 'Network - Protocol',
    description: '',
    required: false,
    options: {
      options: [
      { label: 'ocpp 1.5', value: 'ocpp 1.5' },
      { label: 'ocpp 1.6', value: 'ocpp 1.6' },
      { label: 'ocpp 1.6 soap', value: 'ocpp 1.6 soap' },
      { label: 'ocpp 2.0.1', value: 'ocpp 2.0.1' }
      ],
    },
  }),

  network__password: Property.ShortText({
    displayName: 'Network - Password',
    required: false,
  }),

  network__ip: Property.ShortText({
    displayName: 'Network - Ip',
    description: 'Required for ocpp 1.5 (SOAP).',
    required: false,
  }),

  network__port: Property.Number({
    displayName: 'Network - Port',
    description: 'Required for ocpp 1.5 (SOAP).',
    required: false,
  }),

  capabilities: Property.StaticMultiSelectDropdown({
    displayName: 'Capabilities',
    description: `\`remote_start_stop_capable\` - whether Remote start/stop is possible for the Charge Point </br>\n\`meter_values\` - whether the Charge Point should send meter updates to the system </br>\n\`stop_transaction_on_ev_disconnect\` - for ongoing sessions, when the cable is unplugged this should stop the session and if it is returned back a new session would be created. </br>\n\`disregard_the_heartbeats\` - only for OCPP 1.5 SOAP. Network status by default is updated based on the heartbeat messages. When enabled, the Charge Point would be always treated as available and its network status would not depend on heartbeat messages. </br>\n\`display_messages\` - charger has a display and it is enabled to display messages. This capability is enabled automatically when the charger reports the corresponding configuration key. When creating a charge point, the capability is ignored as it is automatically detected on boot. </br>\n`,
    required: false,
    options: {
      options: [
      { label: 'remote_start_stop_capable', value: 'remote_start_stop_capable' },
      { label: 'meter_values', value: 'meter_values' },
      { label: 'stop_transaction_on_ev_disconnect', value: 'stop_transaction_on_ev_disconnect' },
      { label: 'disregard_the_heartbeats', value: 'disregard_the_heartbeats' },
      { label: 'display_messages', value: 'display_messages' }
      ],
    },
  }),

  autoStartWithoutAuthorization: Property.StaticDropdown({
    displayName: 'Auto Start Without Authorization',
    description: `When enabled the system would allow charging sessions initiated </br>\nlocally by the charge point assuming it is setup to work in auto-start / </br>\nplug-and-charge mode. It would also automatically start a </br>\nsession with a remote start command if one is not already started by the charging stations a  </br>\nfew seconds after a Preparing status is detected indicating that a vehicle is connected.\n`,
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  disableAutoStartEmulation: Property.StaticDropdown({
    displayName: 'Disable Auto Start Emulation',
    description: `The Auto-start option above does 2 things: (1) it allows charging </br>\nsessions started by the charge point assuming that it may be set up locally </br>\nto auto-start charging when a vehicle is connected and (2) if the charging </br>\nstation doesnt start the session within a few seconds after the vehicles is </br>\nconnected the system sends a remote start command - which is to emulate auto-start </br>\ncharging. With this checkbox you can disable the emulation and rely </br>\nentirely on the charging station to auto-start the charging. </br>\n`,
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  security__desiredProfile: Property.Number({
    displayName: 'Security - Desired Profile',
    description: 'The backend will try to set it 3 times at boot notification. If the charge point does not support it, the backend will use the highest security profile the charge point could use. </br> The following security profiles are supported: </br> 0: `No Authentication` </br> 1: `Unsecured Trasport with Basic Authentication (Plain-back Authentication)` - It does not include authentication for the CSMS, or measures to set up a secure communication channel.',
    required: false,
  }),

  modelId: Property.Number({
    displayName: 'Model Id',
    description: `The ID of the CP Model, if one is associated with the Charge Point. Can be set to null to remove the current CP Model associated with the Charge Point. Mind that on boot the charger reports the hardware model and it is automatically updated.\n`,
    required: false,
  }),

  enableAutoFaultRecovery: Property.StaticDropdown({
    displayName: 'Enable Auto Fault Recovery',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  user__id: Property.Number({
    displayName: 'User - Id',
    required: false,
  }),

  user__automaticFirmwareUpdatesEnabled: Property.StaticDropdown({
    displayName: 'User - Automatic Firmware Updates Enabled',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  partner__id: Property.Number({
    displayName: 'Partner - Id',
    required: false,
  }),

  partner__contractId: Property.Number({
    displayName: 'Partner - Contract Id',
    description: '',
    required: false,
  }),

  partner__contactId: Property.Number({
    displayName: 'Partner - Contact Id',
    description: '',
    required: false,
  }),

  partner__corporateBillingAsDefault: Property.StaticDropdown({
    displayName: 'Partner - Corporate Billing As Default',
    description: 'The partner\'s corporate billing would be used as a payment method by default, when a user who is invited to use the partner\'s corporate billing starts a session on the charge point.',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  partner__accessType: Property.StaticDropdown({
    displayName: 'Partner - Access Type',
    description: '`private_view_private_use` - only users invited by the partner with the option to access private charge points could view this charge point on the map and use it.',
    required: false,
    options: {
      options: [
      { label: 'private_view_private_use', value: 'private_view_private_use' },
      { label: 'private_view_public_use', value: 'private_view_public_use' },
      { label: 'public_view_private_use', value: 'public_view_private_use' }
      ],
    },
  }),

  partner__notice: Property.Array({
    displayName: 'Partner - Notice',
    description: 'The notice is only available if the charge point is of type `private` and the accessType is `public_view_private_use`.',
    required: false,
    properties: { 
         
  locale: Property.ShortText({
    displayName: 'Locale',
    description: 'valid locale.',
    required: false,
  }),

  translation: Property.ShortText({
    displayName: 'Translation',
    description: '',
    required: false,
  }), 
    },
  }),

  utilityId: Property.Number({
    displayName: 'Utility Id',
    description: '',
    required: false,
  }),

  tags: Property.Array({
    displayName: 'Tags',
    description: 'Tags can be used for filtering and grouping chargers by tag. When doing a PATCH input all tags that should be associated with the charge point. Omitting a tag would remove it from the charge point.',
    required: false,
  }),

  enabledRandomisedDelay: Property.StaticDropdown({
    displayName: 'Enabled Randomised Delay',
    description: 'Applicable only for personal charge points. For `public` and `private` charge points will be omitted',
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  noticeId: Property.Number({
    displayName: 'Notice Id',
    description: 'If both noticeId and partner.notice object are provided in the request the noticeId will be used to complete the request NOT the partner.notice object!',
    required: false,
  }),

  usesRenewableEnergy: Property.StaticDropdown({
    displayName: 'Uses Renewable Energy',
    description: `When enabled, if no electricity rate is assigned to the charge point any roaming session will be marked as using renewable energy.\nThe actual energy mix can be specified in an electricity rate, which can then be assigned to the charge point. In that case the energy mix will be provided for roaming sessions.\nThis information can be gathered from the utility provider or third-party platforms that provide this information to the public.\n`,
    required: false,
    options: {
      options: [
      { label: 'true', value: 'true' },
      { label: 'false', value: 'false' }
      ],
    },
  }),

  integratedAt: Property.DateTime({
    displayName: 'Integrated At',
    description: 'ISO 8601 formatted date',
    required: false,
  }),

  manufacturedAt: Property.DateTime({
    displayName: 'Manufactured At',
    description: 'ISO 8601 formatted date',
    required: false,
  }),
  },
  async run(context): Promise<ChargePointUpdateResponse> {
    try {
      const url = processPathParameters('/public-api/resources/charge-points/v2.0/{chargePoint}', context.propsValue);
      
      const queryParams = prepareQueryParams(context.propsValue, ['include']);
      
      const body = prepareRequestBody(context.propsValue,
        ['name', 'type', 'pin', 'locationId', 'chargingZoneId', 'electricityRateId', 'subscription', 'networkType', 'status', 'managedByOperator', 'externalId', 'network', 'capabilities', 'autoStartWithoutAuthorization', 'disableAutoStartEmulation', 'security', 'modelId', 'enableAutoFaultRecovery', 'user', 'partner', 'utilityId', 'tags', 'enabledRandomisedDelay', 'noticeId', 'usesRenewableEnergy', 'integratedAt', 'manufacturedAt']
      );

      
      return await makeAmpecoApiCall(
        context.auth,
        url,
        HttpMethod.PATCH,
        body,
        queryParams
      ) as ChargePointUpdateResponse;

    } catch (error) {
      handleApiError(error);
    }
  },
});
