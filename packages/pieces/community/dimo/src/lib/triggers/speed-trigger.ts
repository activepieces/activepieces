import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { dimoAuth } from '../../index';

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

export const speedTrigger = createTrigger({
  auth: dimoAuth,
  name: 'speed_trigger',
  displayName: 'Speed Trigger',
  description: 'Triggers when vehicle speed meets specified conditions (requires Developer JWT)',
  type: TriggerStrategy.WEBHOOK,
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description: 'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions)',
      required: false,
    }),
    conditionType: Property.StaticDropdown({
      displayName: 'Condition Type',
      description: 'How to compare the vehicle speed',
      required: true,
      defaultValue: 'greater',
      options: {
        options: [
          { label: 'Equal to', value: 'equal' },
          { label: 'Greater than', value: 'greater' },
          { label: 'Less than', value: 'less' },
          { label: 'Greater than or equal', value: 'greater_equal' },
          { label: 'Less than or equal', value: 'less_equal' },
        ],
      },
    }),
    speedValue: Property.Number({
      displayName: 'Speed Value (km/h)',
      description: 'Speed value to compare against in kilometers per hour',
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
      defaultValue: 'activepieces-speed-trigger',
    }),
  },
  sampleData: {
    tokenId: 17,
    timestamp: '2025-05-07T22:50:23Z',
    name: 'speed',
    valueNumber: 65.5,
    valueString: '',
    source: '0xF26421509Efe92861a587482100c6d728aBf1CD0',
    producer: 'did:nft:137:0x9c94C395cBcBDe662235E0A9d3bB87Ad708561BA_31700',
    cloudEventId: '2wmskfxoQk8r4chUZCat7tSnJLN',
  },
  async onEnable(context) {
    const { vehicleTokenIds, conditionType, speedValue, triggerFrequency, verificationToken } = context.propsValue;
    
    if (!context.auth.developerJwt) {
      throw new Error('Developer JWT is required for speed trigger. Please provide a Developer JWT in the authentication configuration.');
    }

    // Build trigger condition based on type
    let triggerCondition = '';
    switch (conditionType) {
      case 'equal':
        triggerCondition = `valueNumber = ${speedValue}`;
        break;
      case 'greater':
        triggerCondition = `valueNumber > ${speedValue}`;
        break;
      case 'less':
        triggerCondition = `valueNumber < ${speedValue}`;
        break;
      case 'greater_equal':
        triggerCondition = `valueNumber >= ${speedValue}`;
        break;
      case 'less_equal':
        triggerCondition = `valueNumber <= ${speedValue}`;
        break;
      default:
        throw new Error('Invalid condition type');
    }

    try {
      // Step 1: Create webhook configuration
      const webhookResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://vehicle-events-api.dimo.zone/v1/webhooks',
        body: {
          service: 'Telemetry',
          data: 'speed',
          trigger: triggerCondition,
          setup: triggerFrequency,
          description: `Speed trigger: ${conditionType} ${speedValue} km/h`,
          target_uri: context.webhookUrl,
          status: 'Active',
          verification_token: verificationToken || 'activepieces-speed-trigger',
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
      throw new Error(`Failed to setup speed trigger: ${error.message}`);
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

    // Verify this is a speed event
    if (webhookBody.name !== 'speed') {
      throw new Error('Received non-speed webhook event');
    }

    // Return the webhook data
    return [
      {
        vehicleTokenId: webhookBody.tokenId,
        timestamp: webhookBody.timestamp,
        signal: webhookBody.name,
        speedKmh: webhookBody.valueNumber,
        speedMph: Math.round((webhookBody.valueNumber * 0.621371) * 100) / 100, // Convert to MPH
        source: webhookBody.source,
        producer: webhookBody.producer,
        eventId: webhookBody.cloudEventId,
        triggerInfo: {
          conditionMet: true,
          actualValue: webhookBody.valueNumber,
          configuredCondition: context.propsValue.conditionType,
          configuredValue: context.propsValue.speedValue,
        },
      },
    ];
  },
}); 