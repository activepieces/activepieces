import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';
import { TriggerComparisonType, getTriggerCondition } from '../common/trigger-helpers';

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

export const odometerTrigger = createTrigger({
  auth: dimoAuth,
  name: 'odometer_trigger',
  displayName: 'Odometer Trigger',
  description: 'Triggers when vehicle odometer meets the specified condition - requires Developer JWT',
  type: TriggerStrategy.WEBHOOK,
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description: 'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions)',
      required: false,
    }),
    comparisonType: Property.StaticDropdown({
      displayName: 'Comparison Type',
      description: 'How to compare the odometer value',
      required: true,
      defaultValue: TriggerComparisonType.GREATER_THAN,
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
    verificationToken: Property.ShortText({
      displayName: 'Verification Token',
      description: 'Token for webhook verification (optional)',
      required: false,
      defaultValue: 'activepieces-odometer-trigger',
    }),
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
    const { vehicleTokenIds, comparisonType, odometerValue, triggerFrequency, verificationToken } = context.propsValue;
    
    if (!context.auth.developerJwt) {
      throw new Error('Developer JWT is required for odometer trigger. Please provide a Developer JWT in the authentication configuration.');
    }

    // Build trigger condition
    const triggerCondition = getTriggerCondition(comparisonType, odometerValue);

    try {
      // Step 1: Create webhook configuration
      const webhookResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://vehicle-events-api.dimo.zone/v1/webhooks',
        body: {
          service: 'Telemetry',
          data: 'powertrainTransmissionTravelledDistance',
          trigger: triggerCondition,
          setup: triggerFrequency,
          description: `Odometer trigger: ${comparisonType} ${odometerValue} km`,
          target_uri: context.webhookUrl,
          status: 'Active',
          verification_token: verificationToken || 'activepieces-odometer-trigger',
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
      throw new Error(`Failed to setup odometer trigger: ${error.message}`);
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
          comparison: context.propsValue.comparisonType,
          threshold: context.propsValue.odometerValue,
          actualValue: odometerKm,
          unit: 'km',
        },
      },
    ];
  },
}); 