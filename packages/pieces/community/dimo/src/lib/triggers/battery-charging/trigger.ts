import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { WebhookInfo, WebhookPayload, WebhookDefinition, TriggerField, BooleanOperator, vehicleEventTriggerToText } from '../../models';
import { getHeaders, handleFailures } from '../../helpers';
import { VEHICLE_EVENTS_OPERATIONS } from '../../actions/vehicle-events/constant';
import { verificationTokenInput } from '../common';
import { dimoAuth } from '../../../index';
import { WebhookHandshakeStrategy } from '@activepieces/shared';

export const batteryChargingTrigger = createTrigger({
  auth: dimoAuth,
  handshakeConfiguration : {
    strategy : WebhookHandshakeStrategy.NONE,
  },
  name: 'battery-is-charging-trigger',
  displayName: 'Battery Is Charging Trigger',
  description: 'Triggers when vehicle battery charging status changes (True/False) - requires Developer JWT',
  type: TriggerStrategy.WEBHOOK,
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description: 'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions)',
      required: false,
    }),
    chargingState: Property.StaticDropdown({
      displayName: 'Charging State',
      description: 'Trigger when battery starts or stops charging',
      required: true,
      defaultValue: 'true',
      options: {
        options: [
          { label: 'True (battery is charging)', value: 'true' },
          { label: 'False (battery is not charging)', value: 'false' },
        ],
      },
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
    name: 'powertrainTractionBatteryChargingIsCharging',
    valueNumber: 1,
    valueString: '',
    source: '0xF26421509Efe92861a587482100c6d728aBf1CD0',
    producer: 'did:nft:137:0x9c94C395cBcBDe662235E0A9d3bB87Ad708561BA_31700',
    cloudEventId: '2wmskfxoQk8r4chUZCat7tSnJLN',
  },
  async onEnable(context) {
    const { vehicleTokenIds, chargingState, triggerFrequency, verificationToken } = context.propsValue;
    const { developerJwt } = context.auth;

    const webhookDef: WebhookDefinition = {
      service: 'Telemetry',
      data: TriggerField.PowertrainTractionBatteryChargingIsCharging,
      trigger: {
        field: TriggerField.PowertrainTractionBatteryChargingIsCharging,
        operator: BooleanOperator.Is,
        value: chargingState === "true"
      },
      setup: triggerFrequency as 'Realtime' | 'Hourly',
      description: `Battery charging trigger: ${chargingState === 'true' ? 'CHARGING' : 'NOT CHARGING'}`,
      targetUri: context.webhookUrl,
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
    // Step 2: Subscribe vehicles to the webhook
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
    // Store webhook info for cleanup
    await context.store.put<WebhookInfo>('webhook_info', {
      webhookId,
      verificationToken
    });
  },
  async onDisable(context) {
    const { developerJwt } = context.auth;
    const webhookInfo = await context.store.get<WebhookInfo>('webhook_info');
    if (webhookInfo?.webhookId && developerJwt) {
      const unsubscribeAllVehicles = await httpClient.sendRequest({
        method: VEHICLE_EVENTS_OPERATIONS.unsubscribeAllVehicles.method,
        url: VEHICLE_EVENTS_OPERATIONS.unsubscribeAllVehicles.url({ webhookId: webhookInfo.webhookId }),
        headers: getHeaders(developerJwt),
      });
      handleFailures(unsubscribeAllVehicles);
      await httpClient.sendRequest({
        method: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.method,
        url: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.url({ webhookId: webhookInfo.webhookId }),
        headers: getHeaders(developerJwt),
      });
    }
  },
  async onHandshake(context) {
      return {
        body : context.propsValue.verificationToken,
        headers : {
          'Content-Type': 'text/plain',
        },
        status: 200,
      }
  },
  async run(context) {
    const webhookBody = context.payload.body as WebhookPayload;
    // Validate webhook payload structure
    if (!webhookBody || typeof webhookBody !== 'object') {
      throw new Error('Invalid webhook payload');
    }
    // Verify this is a battery charging event
    if (webhookBody.name !== 'powertrainTractionBatteryChargingIsCharging') {
      throw new Error('Received non-battery-charging webhook event');
    }
    const isCharging = webhookBody.valueNumber === 1;
    const chargingStatus = isCharging ? 'CHARGING' : 'NOT CHARGING';
    // Return the webhook data
    return [
      {
        vehicleTokenId: webhookBody.tokenId,
        timestamp: webhookBody.timestamp,
        signal: webhookBody.name,
        isCharging: isCharging,
        chargingStatus: chargingStatus,
        rawValue: webhookBody.valueNumber,
        source: webhookBody.source,
        producer: webhookBody.producer,
        eventId: webhookBody.cloudEventId,
        triggerInfo: {
          conditionMet: true,
          actualState: chargingStatus,
          configuredState: context.propsValue.chargingState === 'true' ? 'CHARGING' : 'NOT CHARGING',
        },
      },
    ];
  },
});
