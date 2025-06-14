import { httpClient } from '@activepieces/pieces-common';
import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { developerAuth } from '../../common';
import { WebhookInfo, WebhookPayload } from '../../models';
import {
  getHeaders,
  getNumberExpression,
  handleFailures,
  Operator,
} from '../../helpers';
import { getTirePressurePositionLabel, TirePressurePosition } from './type';
import { VEHICLE_EVENTS_OPERATIONS } from '../../actions/vehicle-events/constant';

export const tirePressureTrigger = createTrigger({
  auth: developerAuth,
  name: 'tire_pressure_trigger',
  displayName: 'Tire Pressure Trigger',
  description:
    'Triggers when vehicle tire pressure meets the specified condition - requires Developer JWT',
  type: TriggerStrategy.WEBHOOK,
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description:
        'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions)',
      required: false,
    }),
    tirePosition: Property.StaticDropdown({
      displayName: 'Tire Position',
      description: 'Which tire position to monitor',
      required: true,
      defaultValue: TirePressurePosition.FRONT_LEFT,
      options: {
        options: [
          { label: 'Front Left', value: TirePressurePosition.FRONT_LEFT },
          { label: 'Front Right', value: TirePressurePosition.FRONT_RIGHT },
          { label: 'Rear Left', value: TirePressurePosition.REAR_LEFT },
          { label: 'Rear Right', value: TirePressurePosition.REAR_RIGHT },
        ],
      },
    }),
    comparisonType: Property.StaticDropdown({
      displayName: 'Comparison Type',
      description: 'How to compare the tire pressure',
      required: true,
      defaultValue: Operator.LESS_THAN,
      options: {
        options: [
          { label: 'Equal to', value: Operator.EQUAL },
          { label: 'Greater than', value: Operator.GREATER_THAN },
          { label: 'Less than', value: Operator.LESS_THAN },
        ],
      },
    }),
    pressureKpa: Property.Number({
      displayName: 'Tire Pressure (kPa)',
      description: 'The tire pressure in kilopascals to compare against',
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
    name: 'chassisAxleRow1WheelLeftTirePressure',
    valueNumber: 220.5,
    valueString: '',
    source: '0xF26421509Efe92861a587482100c6d728aBf1CD0',
    producer: 'did:nft:137:0x9c94C395cBcBDe662235E0A9d3bB87Ad708561BA_31700',
    cloudEventId: '2wmskfxoQk8r4chUZCat7tSnJLN',
  },
  async onEnable(context) {
    const {
      vehicleTokenIds,
      tirePosition,
      comparisonType,
      pressureKpa,
      triggerFrequency,
      verificationToken,
    } = context.propsValue;

    // Build trigger condition
    const triggerCondition = getNumberExpression(comparisonType, pressureKpa);

    // Step 1: Create webhook configuration
    const webhookResponse = await httpClient.sendRequest({
      method: VEHICLE_EVENTS_OPERATIONS.createWebhook.method,
      url: VEHICLE_EVENTS_OPERATIONS.createWebhook.url({}),
      body: {
        service: 'Telemetry',
        data: tirePosition,
        trigger: triggerCondition,
        setup: triggerFrequency,
        description: `Tire pressure trigger: ${getTirePressurePositionLabel(
          tirePosition
        )} ${comparisonType} ${pressureKpa} kPa`,
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
    if (vehicleTokenIds && vehicleTokenIds.length > 0) {
      await Promise.all(
        vehicleTokenIds.map(async (tokenId) => {
          const res = await httpClient.sendRequest({
            method: VEHICLE_EVENTS_OPERATIONS.subscribeVehicle.method,
            url: VEHICLE_EVENTS_OPERATIONS.subscribeVehicle.url({
              webhookId,
              tokenId: Number(tokenId),
            }),
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
    try {
      const webhookInfo = await context.store.get<WebhookInfo>('webhook_info');

      if (webhookInfo?.webhookId && context.auth.token) {
        // Delete the webhook configuration
        await httpClient.sendRequest({
          method: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.method,
          url: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.url({
            webhookId: webhookInfo.webhookId,
          }),
          headers: getHeaders(context.auth.token),
        });
      }
    } catch (error) {
      console.warn('Failed to cleanup webhook:', error);
    }
  },

  async run(context) {
    const webhookBody = context.payload.body as WebhookPayload;

    // Validate webhook payload structure
    if (!webhookBody || typeof webhookBody !== 'object') {
      throw new Error('Invalid webhook payload');
    }

    // Verify this is a tire pressure event
    const validTireSignals = [
      TirePressurePosition.FRONT_LEFT,
      TirePressurePosition.FRONT_RIGHT,
      TirePressurePosition.REAR_LEFT,
      TirePressurePosition.REAR_RIGHT,
    ];

    if (!validTireSignals.includes(webhookBody.name as TirePressurePosition)) {
      throw new Error('Received non-tire-pressure webhook event');
    }

    const pressureKpa = webhookBody.valueNumber;
    const pressurePsi = Math.round(pressureKpa * 0.145038 * 100) / 100; // Convert kPa to PSI
    const pressureBar = Math.round(pressureKpa * 0.01 * 100) / 100; // Convert kPa to bar

    // Determine tire position and status
    const tirePosition = webhookBody.name as TirePressurePosition;
    const positionLabel = getTirePressurePositionLabel(tirePosition);

    // Standard tire pressure ranges (rough estimates)
    const isLowPressure = pressureKpa < 180; // < ~26 PSI
    const isHighPressure = pressureKpa > 280; // > ~40 PSI
    const pressureStatus = isLowPressure
      ? 'Low'
      : isHighPressure
      ? 'High'
      : 'Normal';

    // Return the webhook data
    return [
      {
        vehicleTokenId: webhookBody.tokenId,
        timestamp: webhookBody.timestamp,
        signal: webhookBody.name,
        tirePosition: positionLabel,
        pressureKpa: pressureKpa,
        pressurePsi: pressurePsi,
        pressureBar: pressureBar,
        pressureStatus: pressureStatus,
        isLowPressure: isLowPressure,
        isHighPressure: isHighPressure,
        rawValue: webhookBody.valueNumber,
        source: webhookBody.source,
        producer: webhookBody.producer,
        eventId: webhookBody.cloudEventId,
        triggerInfo: {
          conditionMet: true,
          comparison: context.propsValue.comparisonType,
          threshold: context.propsValue.pressureKpa,
          actualValue: pressureKpa,
          unit: 'kPa',
          monitoredPosition: positionLabel,
        },
      },
    ];
  },
});
