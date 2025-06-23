import { httpClient } from '@activepieces/pieces-common';
import { VEHICLE_EVENTS_OPERATIONS } from '../../actions/vehicle-events/constant';
import {
  getHeaders,
  handleFailures,
} from '../../helpers';
import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { WebhookInfo, WebhookPayload, WebhookDefinition, TriggerField, vehicleEventTriggerToText, NumericTriggerField } from '../../models';
import { operatorStaticDropdown, verificationTokenInput } from '../common';
import { dimoAuth } from '../../../index';
import { WebhookHandshakeStrategy } from '@activepieces/shared';

export const odometerTrigger = createTrigger({
  auth: dimoAuth,
  name: 'odometer-trigger',
  displayName: 'Odometer Trigger',
  description:
    'Triggers when vehicle odometer meets the specified condition - requires Developer JWT',
  type: TriggerStrategy.WEBHOOK,
  handshakeConfiguration: {
    strategy : WebhookHandshakeStrategy.NONE,
  },
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description:
        'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions)',
      required: false,
    }),
    operator: operatorStaticDropdown,
    odometerValue: Property.Number({
      displayName: 'Odometer Value (km)',
      description: 'The odometer value in kilometers to compare against',
      required: true,
    }),
    triggerFrequency: Property.StaticDropdown({
      displayName: 'Trigger Frequency',
      description: 'How often the webhook should fire when condition is met',
      required: true,
      defaultValue: 'Realtime',
      options: {
        options: [
          { label: 'Real-time (continuous)', value: 'Realtime' },
          { label: 'Hourly', value: 'Hourly' },
        ],
      },
    }),
    verificationToken: verificationTokenInput
  },
  sampleData: {
    tokenId: 17,
    timestamp: '2025-05-07T22:50:23Z',
    name: 'powertrainTransmissionTravelledDistance',
    valueNumber: 52847.5,
    valueString: '',
    source: '0xF26421509Efe92861a587482100c6d728aBf1CD0',
    producer: 'did:nft:137:0x9c94C395cBcBDe662235E0A9d3bB87Ad708561BA_31700',
    cloudEventId: '2wmskfxoQk8r4chUZCat7tSnJLN',
  },
  async onEnable(context) {
    const {
      vehicleTokenIds,
      operator,
      odometerValue,
      triggerFrequency,
      verificationToken,
    } = context.propsValue;
    const { developerJwt } = context.auth;


    console.log(`Original webhook URL: ${context.webhookUrl}`);
    const triggerWebhookId = context.webhookUrl.substring(
      context.webhookUrl.lastIndexOf('/') + 1)

      const triggerWebhookUrl = `https://constantly-sweet-cardinal.ngrok-free.app/api/v1/webhooks/${triggerWebhookId}`;
    const webhookDef: WebhookDefinition = {
      service: 'Telemetry',
      data: TriggerField.PowertrainTransmissionTravelledDistance,
      trigger: {
        field: TriggerField.PowertrainTransmissionTravelledDistance as NumericTriggerField,
        operator,
        value: odometerValue,
      },
      setup: triggerFrequency as 'Realtime' | 'Hourly',
      description: `Odometer trigger: ${operator} ${odometerValue} km`,
      // targetUri: context.webhookUrl,
      targetUri: triggerWebhookUrl,
      status: 'Active',
    };
    const webhookResponse = await httpClient.sendRequest({
      method: VEHICLE_EVENTS_OPERATIONS.createWebhook.method,
      url: VEHICLE_EVENTS_OPERATIONS.createWebhook.url({}),
      body: {
        service: webhookDef.service,
        data: webhookDef.data,
        trigger: vehicleEventTriggerToText(webhookDef.trigger),
        setup: webhookDef.setup,
        description: webhookDef.description,
        target_uri: webhookDef.targetUri,
        status: webhookDef.status,
        verification_token: verificationToken
      },
      headers: getHeaders(developerJwt),
    });
    handleFailures(webhookResponse);
    if (!webhookResponse.body.id) {
      throw new Error('Failed to create webhook: No webhook ID returned');
    }
    const webhookId = webhookResponse.body.id;
    if (vehicleTokenIds && vehicleTokenIds.length > 0) {
      await Promise.all(
        vehicleTokenIds.map(async (tokenId) => {
          const res = await httpClient.sendRequest({
            method: VEHICLE_EVENTS_OPERATIONS.subscribeVehicle.method,
            url: VEHICLE_EVENTS_OPERATIONS.subscribeVehicle.url({ webhookId, tokenId: Number(tokenId) }),
            headers: getHeaders(developerJwt),
          });
          handleFailures(res);
        })
      );
    } else {
      const res = await httpClient.sendRequest({
        method: VEHICLE_EVENTS_OPERATIONS.subscribeAllVehicles.method,
        url: VEHICLE_EVENTS_OPERATIONS.subscribeAllVehicles.url({ webhookId }),
        headers: getHeaders(developerJwt),
      });
      handleFailures(res);
    }
    await context.store.put<WebhookInfo>('webhook_info', {
      webhookId,
      verificationToken,
    });
  },
    async onHandshake(context) {
    console.log('Handshake triggered for odometer webhook');
      return {
        body : context.propsValue.verificationToken,
        headers : {
          'Content-Type': 'text/plain',
        },
        status: 200,
      }
  },
  async onDisable(context) {
    const { developerJwt } = context.auth;
    const webhookInfo = await context.store.get<WebhookInfo>('webhook_info');
    if (!webhookInfo) {
      throw new Error(
        'No webhook information found in store. Please enable the trigger first.'
      );
    }
    const res = await httpClient.sendRequest({
      method: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.method,
      url: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.url({
        webhookId: webhookInfo.webhookId,
      }),
      headers: getHeaders(developerJwt),
    });
    handleFailures(res);
    await context.store.delete('webhook_info');
  },
  async run(context) {
    const webhookBody = context.payload.body as WebhookPayload;

    // Validate webhook payload structure
    if (!webhookBody || typeof webhookBody !== 'object') {
      throw new Error('Invalid webhook payload');
    }

    // Verify this is an odometer event
    if (webhookBody.name !== 'powertrainTransmissionTravelledDistance') {
      throw new Error('Received non-odometer webhook event');
    }

    const odometerKm = webhookBody.valueNumber;
    const odometerMiles = Math.round(odometerKm * 0.621371 * 100) / 100; // Convert km to miles

    // Return the webhook data
    return [
      {
        vehicleTokenId: webhookBody.tokenId,
        timestamp: webhookBody.timestamp,
        signal: webhookBody.name,
        odometerKm: odometerKm,
        odometerMiles: odometerMiles,
        rawValue: webhookBody.valueNumber,
        source: webhookBody.source,
        producer: webhookBody.producer,
        eventId: webhookBody.cloudEventId,
        triggerInfo: {
          conditionMet: true,
          operator: context.propsValue.operator,
          threshold: context.propsValue.odometerValue,
          actualValue: odometerKm,
          unit: 'km',
        },
      },
    ];
  },
});
