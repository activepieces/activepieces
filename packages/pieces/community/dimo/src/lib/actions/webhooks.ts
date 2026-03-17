import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoDeveloperAuth, DimoAuthProps } from '../common/auth';
import { DIMO_API_URLS } from '../common/constants';

export const dimoListWebhooks = createAction({
  auth: dimoDeveloperAuth,
  name: 'webhooks_list',
  displayName: 'List Webhooks',
  description: 'List all webhooks configured for your developer license. Requires Developer JWT.',
  props: {},
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for Webhooks API calls.');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DIMO_API_URLS.VEHICLE_TRIGGERS}/v1/webhooks`,
      headers: {
        Authorization: `Bearer ${developerJwt}`,
      },
    });

    return response.body;
  },
});

export const dimoCreateWebhook = createAction({
  auth: dimoDeveloperAuth,
  name: 'webhooks_create',
  displayName: 'Create Webhook',
  description: 'Create a new webhook subscription for vehicle signal events. Requires Developer JWT.',
  props: {
    target_url: Property.ShortText({
      displayName: 'Target URL',
      description: 'The URL to receive webhook events.',
      required: true,
    }),
    service: Property.StaticDropdown({
      displayName: 'Service',
      description: 'The DIMO service to watch.',
      required: true,
      options: {
        options: [
          { label: 'Vehicle Signal', value: 'vehicle-signal-decoding' },
        ],
      },
    }),
    metric_name: Property.StaticDropdown({
      displayName: 'Signal / Metric',
      description: 'The vehicle signal to monitor.',
      required: true,
      options: {
        options: [
          { label: 'Speed', value: 'speed' },
          { label: 'Ignition', value: 'isIgnitionOn' },
          { label: 'Odometer', value: 'powertrainTransmissionTravelledDistance' },
          { label: 'Fuel System Relative Level', value: 'powertrainFuelSystemRelativeLevel' },
          { label: 'Fuel System Absolute Level', value: 'powertrainFuelSystemAbsoluteLevel' },
          { label: 'Battery Current Power', value: 'powertrainTractionBatteryCurrentPower' },
          { label: 'Battery Charging Status', value: 'powertrainTractionBatteryChargingIsCharging' },
          { label: 'Charge Level (State of Charge)', value: 'powertrainTractionBatteryStateOfChargeCurrent' },
          { label: 'Tire Pressure - Front Left', value: 'chassisAxleRow1WheelLeftTirePressure' },
          { label: 'Tire Pressure - Front Right', value: 'chassisAxleRow1WheelRightTirePressure' },
          { label: 'Tire Pressure - Rear Left', value: 'chassisAxleRow2WheelLeftTirePressure' },
          { label: 'Tire Pressure - Rear Right', value: 'chassisAxleRow2WheelRightTirePressure' },
        ],
      },
    }),
    condition: Property.ShortText({
      displayName: 'Condition Expression',
      description: 'Condition for triggering the webhook (e.g. "$ > 60", "$ == true", "$ < 30").',
      required: true,
    }),
    cool_down_period: Property.Number({
      displayName: 'Cool Down Period (seconds)',
      description: 'Minimum time between webhook triggers for the same vehicle (in seconds).',
      required: true,
    }),
    verification_token: Property.ShortText({
      displayName: 'Verification Token',
      description: 'A secret token to verify webhook authenticity.',
      required: true,
    }),
    description: Property.ShortText({
      displayName: 'Description (optional)',
      description: 'A human-readable description for this webhook.',
      required: false,
    }),
    display_name: Property.ShortText({
      displayName: 'Display Name (optional)',
      description: 'A display name for this webhook.',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Initial status of the webhook.',
      required: true,
      options: {
        options: [
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for Webhooks API calls.');
    }

    const {
      target_url,
      service,
      metric_name,
      condition,
      cool_down_period,
      verification_token,
      description,
      display_name,
      status,
    } = context.propsValue;

    const body: Record<string, unknown> = {
      service,
      metricName: metric_name,
      condition,
      coolDownPeriod: cool_down_period,
      targetURL: target_url,
      status,
      verificationToken: verification_token,
    };

    if (description) body['description'] = description;
    if (display_name) body['displayName'] = display_name;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${DIMO_API_URLS.VEHICLE_TRIGGERS}/v1/webhooks`,
      headers: {
        Authorization: `Bearer ${developerJwt}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    return response.body;
  },
});

export const dimoDeleteWebhook = createAction({
  auth: dimoDeveloperAuth,
  name: 'webhooks_delete',
  displayName: 'Delete Webhook',
  description: 'Delete a webhook subscription. Requires Developer JWT.',
  props: {
    webhook_id: Property.ShortText({
      displayName: 'Webhook ID',
      description: 'The ID of the webhook to delete.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for Webhooks API calls.');
    }

    const { webhook_id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${DIMO_API_URLS.VEHICLE_TRIGGERS}/v1/webhooks/${webhook_id}`,
      headers: {
        Authorization: `Bearer ${developerJwt}`,
      },
    });

    return response.body;
  },
});

export const dimoSubscribeVehicleToWebhook = createAction({
  auth: dimoDeveloperAuth,
  name: 'webhooks_subscribe_vehicle',
  displayName: 'Subscribe Vehicle to Webhook',
  description: 'Subscribe a specific vehicle to receive webhook notifications. Requires Developer JWT.',
  props: {
    webhook_id: Property.ShortText({
      displayName: 'Webhook ID',
      description: 'The ID of the webhook.',
      required: true,
    }),
    token_did: Property.ShortText({
      displayName: 'Vehicle Token DID',
      description: 'The vehicle DID (did:eth:1:0x...:tokenId format) or token ID.',
      required: true,
    }),
  },
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for Webhooks API calls.');
    }

    const { webhook_id, token_did } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${DIMO_API_URLS.VEHICLE_TRIGGERS}/v1/webhooks/${webhook_id}/subscribe/${token_did}`,
      headers: {
        Authorization: `Bearer ${developerJwt}`,
        'Content-Type': 'application/json',
      },
    });

    return response.body;
  },
});

export const dimoGetWebhookSignalNames = createAction({
  auth: dimoDeveloperAuth,
  name: 'webhooks_get_signal_names',
  displayName: 'Get Available Webhook Signal Names',
  description: 'Get a list of all available signal names that can be used for webhook conditions. Requires Developer JWT.',
  props: {},
  async run(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for Webhooks API calls.');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: `${DIMO_API_URLS.VEHICLE_TRIGGERS}/v1/webhooks/signals`,
      headers: {
        Authorization: `Bearer ${developerJwt}`,
      },
    });

    return response.body;
  },
});
