import { createTrigger, TriggerStrategy, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { WebhookHandshakeStrategy } from '@activepieces/shared';
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

export const batteryPowerTrigger = createTrigger({
  auth: dimoAuth,
  name: 'battery_power_trigger',
  displayName: 'Battery Current Power Trigger',
  description: 'Triggers when vehicle battery current power meets the specified condition - requires Developer JWT',
  type: TriggerStrategy.WEBHOOK,
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.QUERY_PRESENT,
    paramName: 'verify',
  },
  async onHandshake(context) {
    return {
      status: 200,
      body: context.payload.queryParams['verify'] || 'OK',
    };
  },
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description: 'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions)',
      required: false,
    }),
    comparisonType: Property.StaticDropdown({
      displayName: 'Comparison Type',
      description: 'How to compare the battery power in watts',
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
      defaultValue: 'activepieces-battery-power-trigger',
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
    const { vehicleTokenIds, comparisonType, powerWatts, triggerFrequency, verificationToken } = context.propsValue;
    
    if (!context.auth.developerJwt) {
      throw new Error('Developer JWT is required for battery power trigger. Please provide a Developer JWT in the authentication configuration.');
    }

    const triggerCondition = getTriggerCondition(comparisonType, powerWatts);

    try {
      const webhookResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://vehicle-events-api.dimo.zone/v1/webhooks',
        body: {
          service: 'Telemetry',
          data: 'powertrainTractionBatteryCurrentPower',
          trigger: triggerCondition,
          setup: triggerFrequency,
          description: `Battery power trigger: ${comparisonType} ${powerWatts}W`,
          target_uri: context.webhookUrl,
          status: 'Active',
          verification_token: verificationToken || 'activepieces-battery-power-trigger',
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

      if (vehicleTokenIds && vehicleTokenIds.length > 0) {
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
        await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `https://vehicle-events-api.dimo.zone/v1/webhooks/${webhookId}/subscribe/all`,
          headers: {
            'Authorization': `Bearer ${context.auth.developerJwt}`,
          },
        });
      }

      await context.store.put<WebhookInfo>('webhook_info', {
        webhookId,
        subscribedVehicles,
      });

    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Authentication failed: Invalid or expired Developer JWT');
      }
      throw new Error(`Failed to setup battery power trigger: ${error.message}`);
    }
  },

  async onDisable(context) {
    try {
      const webhookInfo = await context.store.get<WebhookInfo>('webhook_info');
      
      if (webhookInfo?.webhookId && context.auth.developerJwt) {
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
    
    if (!webhookBody || typeof webhookBody !== 'object') {
      throw new Error('Invalid webhook payload');
    }

    if (webhookBody.name !== 'powertrainTractionBatteryCurrentPower') {
      throw new Error('Received non-battery-power webhook event');
    }

    const powerWatts = webhookBody.valueNumber;
    const powerKw = Math.round(powerWatts / 1000 * 100) / 100; // Convert watts to kilowatts
    const isCharging = powerWatts < 0; // Negative power typically means charging
    const isDischarging = powerWatts > 0; // Positive power typically means discharging

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
          comparison: context.propsValue.comparisonType,
          threshold: context.propsValue.powerWatts,
          actualValue: powerWatts,
          unit: 'W',
        },
      },
    ];
  },
}); 