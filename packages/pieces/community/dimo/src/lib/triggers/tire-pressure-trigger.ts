import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';
import { TriggerComparisonType, getTriggerCondition, TirePressurePosition, getTirePressurePositionLabel } from '../common/trigger-helpers';

interface WebhookInfo {
  webhookId: string;
  subscribedVehicles: number[];
}

interface DimoWebhookPayload {
  tokenId: number;
  timestamp: string;
  name: string;
  valueNumber: number;
  valueString: string;
  source: string;
  producer: string;
  cloudEventId: string;
}

export const tirePressureTrigger = createTrigger({
  auth: dimoAuth,
  name: 'tire_pressure_trigger',
  displayName: 'Tire Pressure Trigger',
  description: 'Triggers when vehicle tire pressure meets the specified condition - requires Developer JWT',
  type: TriggerStrategy.WEBHOOK,
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description: 'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions)',
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
      defaultValue: TriggerComparisonType.LESS_THAN,
      options: {
        options: [
          { label: 'Equal to', value: TriggerComparisonType.EQUAL },
          { label: 'Greater than', value: TriggerComparisonType.GREATER_THAN },
          { label: 'Greater than or equal', value: TriggerComparisonType.GREATER_EQUAL },
          { label: 'Less than', value: TriggerComparisonType.LESS_THAN },
          { label: 'Less than or equal', value: TriggerComparisonType.LESS_EQUAL },
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
      defaultValue: 'activepieces-tire-pressure-trigger',
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
    const { vehicleTokenIds, tirePosition, comparisonType, pressureKpa, triggerFrequency, verificationToken } = context.propsValue;
    
    if (!context.auth.developerJwt) {
      throw new Error('Developer JWT is required for tire pressure trigger. Please provide a Developer JWT in the authentication configuration.');
    }

    // Build trigger condition
    const triggerCondition = getTriggerCondition(comparisonType, pressureKpa);

    try {
      // Step 1: Create webhook configuration
      const webhookResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://vehicle-events-api.dimo.zone/v1/webhooks',
        body: {
          service: 'Telemetry',
          data: tirePosition,
          trigger: triggerCondition,
          setup: triggerFrequency,
          description: `Tire pressure trigger: ${getTirePressurePositionLabel(tirePosition)} ${comparisonType} ${pressureKpa} kPa`,
          target_uri: context.webhookUrl,
          status: 'Active',
          verification_token: verificationToken || 'activepieces-tire-pressure-trigger',
        },
        headers: {
          'Authorization': `Bearer ${context.auth.developerJwt}`,
          'Content-Type': 'application/json',
        },
      });

      if (!webhookResponse.body.id) {
        throw new Error('Failed to create webhook: No webhook ID returned');
      }

      const webhookId = webhookResponse.body.id;
      const subscribedVehicles: number[] = [];

      // Step 2: Subscribe vehicles to the webhook
      if (vehicleTokenIds && vehicleTokenIds.length > 0) {
        // Subscribe specific vehicles
        for (const tokenId of vehicleTokenIds) {
          try {
            await httpClient.sendRequest({
              method: HttpMethod.POST,
              url: `https://vehicle-events-api.dimo.zone/v1/webhooks/${webhookId}/subscribe/${tokenId}`,
              headers: {
                'Authorization': `Bearer ${context.auth.developerJwt}`,
              },
            });
            subscribedVehicles.push(Number(tokenId));
          } catch (error) {
            console.warn(`Failed to subscribe vehicle ${tokenId} to webhook:`, error);
          }
        }
      } else {
        // Subscribe all vehicles with permissions
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `https://vehicle-events-api.dimo.zone/v1/webhooks/${webhookId}/subscribe/all`,
          headers: {
            'Authorization': `Bearer ${context.auth.developerJwt}`,
          },
        });
      }

      // Store webhook info for cleanup
      await context.store.put<WebhookInfo>('webhook_info', {
        webhookId,
        subscribedVehicles,
      });

    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed: Invalid or expired Developer JWT');
      }
      throw new Error(`Failed to setup tire pressure trigger: ${error.message}`);
    }
  },

  async onDisable(context) {
    try {
      const webhookInfo = await context.store.get<WebhookInfo>('webhook_info');
      
      if (webhookInfo?.webhookId && context.auth.developerJwt) {
        // Delete the webhook configuration
        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `https://vehicle-events-api.dimo.zone/v1/webhooks/${webhookInfo.webhookId}`,
          headers: {
            'Authorization': `Bearer ${context.auth.developerJwt}`,
          },
        });
      }
    } catch (error) {
      console.warn('Failed to cleanup webhook:', error);
    }
  },

  async run(context) {
    const webhookBody = context.payload.body as DimoWebhookPayload;
    
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
    const pressureStatus = isLowPressure ? 'Low' : isHighPressure ? 'High' : 'Normal';

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