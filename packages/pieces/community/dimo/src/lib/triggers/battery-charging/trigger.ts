import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { WebhookInfo, WebhookPayload } from '../../models';
import { getHeaders, handleFailures } from '../../helpers';
import { VEHICLE_EVENTS_OPERATIONS } from '../../actions/vehicle-events/constant';
import { developerAuth } from '../../common';
import { verificationTokenInput } from '../common';

export const batteryChargingTrigger = createTrigger({
  auth: developerAuth,
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

    // Build trigger condition for charging state (1 = charging, 0 = not charging)
    const triggerValue = chargingState === 'true' ? 1 : 0;
    const triggerCondition = `valueNumber = ${triggerValue}`;

    // Step 1: Create webhook configuration
    const webhookResponse = await httpClient.sendRequest({
      method: VEHICLE_EVENTS_OPERATIONS.createWebhook.method,
      url: VEHICLE_EVENTS_OPERATIONS.createWebhook.url({}),
      body: {
        service: 'Telemetry',
        data: 'powertrainTractionBatteryChargingIsCharging',
        trigger: triggerCondition,
        setup: triggerFrequency,
        description: `Battery charging trigger: ${chargingState === 'true' ? 'CHARGING' : 'NOT CHARGING'}`,
        target_uri: context.webhookUrl,
        status: 'Active',
        verification_token: verificationToken
      },
      headers: getHeaders(context.auth.token),
    });

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
      verificationToken
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
