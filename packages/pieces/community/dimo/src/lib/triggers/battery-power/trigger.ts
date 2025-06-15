import { httpClient } from "@activepieces/pieces-common";
import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { developerAuth } from "../../common";
import { WebhookInfo, WebhookPayload } from "../../models";
import { getHeaders, getNumberExpression, handleFailures } from "../../helpers";
import { VEHICLE_EVENTS_OPERATIONS } from '../../actions/vehicle-events/constant';
import { operatorStaticDropdown } from "../common";

export const batteryPowerTrigger = createTrigger({
  auth: developerAuth,
  name: 'battery-power-trigger',
  displayName: 'Battery Current Power Trigger',
  description: 'Triggers when vehicle battery current power meets the specified condition - requires Developer JWT',
  type: TriggerStrategy.WEBHOOK,
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description: 'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions)',
      required: false,
    }),
    operator: operatorStaticDropdown,
    powerWatts: Property.Number({
      displayName: 'Battery Power (Watts)',
      description: 'The battery power in watts to compare against',
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
    verificationToken: Property.ShortText({
      displayName: 'Verification Token',
      description: 'Token for webhook verification (optional)',
      required: false,
      defaultValue: 'token',
    }),
  },
  sampleData: {
    tokenId: 17,
    timestamp: '2025-05-07T22:50:23Z',
    name: 'powertrainTractionBatteryCurrentPower',
    valueNumber: -15400.5,
    valueString: '',
    source: '0xF26421509Efe92861a587482100c6d728aBf1CD0',
    producer: 'did:nft:137:0x9c94C395cBcBDe662235E0A9d3bB87Ad708561BA_31700',
    cloudEventId: '2wmskfxoQk8r4chUZCat7tSnJLN',
  },
  async onEnable(context) {
    const { vehicleTokenIds, operator, powerWatts, triggerFrequency, verificationToken } = context.propsValue;

    if (!context.auth.token) {
      throw new Error('Developer JWT is required for battery power trigger. Please provide a Developer JWT in the authentication configuration.');
    }

    // Build trigger condition
    const triggerCondition = getNumberExpression(operator, powerWatts);

    // Step 1: Create webhook configuration
    const webhookResponse = await httpClient.sendRequest({
      method: VEHICLE_EVENTS_OPERATIONS.createWebhook.method,
      url: VEHICLE_EVENTS_OPERATIONS.createWebhook.url({}),
      body: {
        service: 'Telemetry',
        data: 'powertrainTractionBatteryCurrentPower',
        trigger: triggerCondition,
        setup: triggerFrequency,
        description: `Battery power trigger: ${operator} ${powerWatts}W`,
        target_uri: context.webhookUrl,
        status: 'Active',
        verification_token: verificationToken || 'token',
      },
      headers: getHeaders(context.auth.token),
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
            headers: getHeaders(context.auth.token),
          });

          handleFailures(res);
        })
      );
    } else {
      const res = await httpClient.sendRequest({
        method: VEHICLE_EVENTS_OPERATIONS.subscribeAllVehicles.method,
        url: VEHICLE_EVENTS_OPERATIONS.subscribeAllVehicles.url({ webhookId }),
        headers: getHeaders(context.auth.token),
      });
      handleFailures(res);
    }

    // Store webhook info for cleanup
    await context.store.put<WebhookInfo>('webhook_info', {
      webhookId,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInfo>('webhook_info');
    if (webhookInfo?.webhookId && context.auth.token) {
      await httpClient.sendRequest({
        method: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.method,
        url: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.url({ webhookId: webhookInfo.webhookId }),
        headers: getHeaders(context.auth.token),
      });
    }
  },
  async run(context) {
    const webhookBody = context.payload.body as WebhookPayload;

    // Validate webhook payload structure
    if (!webhookBody || typeof webhookBody !== 'object') {
      throw new Error('Invalid webhook payload');
    }

    // Verify this is a battery power event
    if (webhookBody.name !== 'powertrainTractionBatteryCurrentPower') {
      throw new Error('Received non-battery-power webhook event');
    }

    const powerWatts = webhookBody.valueNumber;
    const powerKw = Math.round(powerWatts / 1000 * 100) / 100; // Convert watts to kilowatts
    const isCharging = powerWatts < 0; // Negative power typically means charging
    const isDischarging = powerWatts > 0; // Positive power typically means discharging

    // Return the webhook data
    return [
      {
        vehicleTokenId: webhookBody.tokenId,
        timestamp: webhookBody.timestamp,
        signal: webhookBody.name,
        powerWatts: powerWatts,
        powerKw: powerKw,
        isCharging: isCharging,
        isDischarging: isDischarging,
        powerStatus: isCharging ? 'Charging' : isDischarging ? 'Discharging' : 'Idle',
        rawValue: webhookBody.valueNumber,
        source: webhookBody.source,
        producer: webhookBody.producer,
        eventId: webhookBody.cloudEventId,
        triggerInfo: {
          conditionMet: true,
          operator: context.propsValue.operator,
          threshold: context.propsValue.powerWatts,
          actualValue: powerWatts,
          unit: 'W',
        },
      },
    ];
  },
});
