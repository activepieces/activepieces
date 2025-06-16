import { httpClient } from "@activepieces/pieces-common";
import { createTrigger, TriggerStrategy, Property } from "@activepieces/pieces-framework";
import { WebhookInfo, WebhookPayload } from "../../models";
import { developerAuth } from '../../../index';
import { getHeaders, getNumberExpression, handleFailures } from "../../helpers";
import { VEHICLE_EVENTS_OPERATIONS } from '../../actions/vehicle-events/constant';
import { operatorStaticDropdown, verificationTokenInput } from "../common";

export const chargeLevelTrigger = createTrigger({
  auth: developerAuth,
  name: 'charge-level-trigger',
  displayName: 'Charge Level Trigger',
  description: 'Triggers when vehicle battery charge level meets the specified condition - requires Developer JWT',
  type: TriggerStrategy.WEBHOOK,
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description: 'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions)',
      required: false,
    }),
    operator: operatorStaticDropdown,
    chargePercentage: Property.Number({
      displayName: 'Charge Percentage (%)',
      description: 'The battery charge level percentage (0-100%) to compare against',
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
    name: 'powertrainTractionBatteryStateOfChargeCurrent',
    valueNumber: 73.2,
    valueString: '',
    source: '0xF26421509Efe92861a587482100c6d728aBf1CD0',
    producer: 'did:nft:137:0x9c94C395cBcBDe662235E0A9d3bB87Ad708561BA_31700',
    cloudEventId: '2wmskfxoQk8r4chUZCat7tSnJLN',
  },
  async onEnable(context) {
    const { vehicleTokenIds, operator, chargePercentage, triggerFrequency, verificationToken } = context.propsValue;

    if (!context.auth.token) {
      throw new Error('Developer JWT is required for charge level trigger. Please provide a Developer JWT in the authentication configuration.');
    }

    // Validate charge percentage
    if (chargePercentage < 0 || chargePercentage > 100) {
      throw new Error('Charge percentage must be between 0 and 100');
    }

    // Build trigger condition
    const triggerCondition = getNumberExpression(operator, chargePercentage);

    // Step 1: Create webhook configuration
    const webhookResponse = await httpClient.sendRequest({
      method: VEHICLE_EVENTS_OPERATIONS.createWebhook.method,
      url: VEHICLE_EVENTS_OPERATIONS.createWebhook.url({}),
      body: {
        service: 'Telemetry',
        data: 'powertrainTractionBatteryStateOfChargeCurrent',
        trigger: triggerCondition,
        setup: triggerFrequency,
        description: `Charge level trigger: ${operator} ${chargePercentage}%`,
        target_uri: context.webhookUrl,
        status: 'Active',
        verification_token: verificationToken
      },
      headers: getHeaders(context.auth.token),
    });

    handleFailures(webhookResponse);

    if (!webhookResponse.body.id) {
      throw new Error('Failed to create webhook: No webhook ID returned');
    }

    const webhookId = webhookResponse.body.id;
    const subscribedVehicles: number[] = [];

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
          subscribedVehicles.push(Number(tokenId));
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
      verificationToken
    });
  },

  async onDisable(context) {
    try {
      const webhookInfo = await context.store.get<WebhookInfo>('webhook_info');

      if (webhookInfo?.webhookId && context.auth.token) {
        // Delete the webhook configuration
        await httpClient.sendRequest({
          method: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.method,
          url: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.url({ webhookId: webhookInfo.webhookId }),
          headers: getHeaders(context.auth.token),
        });
      }
    } catch (error) {
      console.warn('Failed to cleanup webhook:', error);
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

    // Verify this is a charge level event
    if (webhookBody.name !== 'powertrainTractionBatteryStateOfChargeCurrent') {
      throw new Error('Received non-charge-level webhook event');
    }

    const chargePercentage = webhookBody.valueNumber;

    // Return the webhook data with comprehensive charge level information
    return [
      {
        vehicleTokenId: webhookBody.tokenId,
        timestamp: webhookBody.timestamp,
        signal: webhookBody.name,
        chargePercentage: chargePercentage,
        chargeLevel: chargePercentage >= 80 ? 'High' : chargePercentage >= 50 ? 'Medium' : chargePercentage >= 20 ? 'Low' : 'Critical',
        isLowBattery: chargePercentage < 20,
        isCriticalBattery: chargePercentage < 10,
        rawValue: webhookBody.valueNumber,
        source: webhookBody.source,
        producer: webhookBody.producer,
        eventId: webhookBody.cloudEventId,
        triggerInfo: {
          conditionMet: true,
          operator: context.propsValue.operator,
          threshold: context.propsValue.chargePercentage,
          actualValue: chargePercentage,
          unit: '%',
        },
      },
    ];
  },
});
