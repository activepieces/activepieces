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

export const ignitionTrigger = createTrigger({
  auth: dimoAuth,
  name: 'ignition_trigger',
  displayName: 'Ignition Status Trigger',
  description: 'Triggers when vehicle ignition status changes (ON/OFF) - requires Developer JWT',
  type: TriggerStrategy.WEBHOOK,
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description: 'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions)',
      required: false,
    }),
    ignitionState: Property.StaticDropdown({
      displayName: 'Ignition State',
      description: 'Trigger when ignition turns ON or OFF',
      required: true,
      defaultValue: 'on',
      options: {
        options: [
          { label: 'ON (ignition turned on)', value: 'on' },
          { label: 'OFF (ignition turned off)', value: 'off' },
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
    verificationToken: Property.ShortText({
      displayName: 'Verification Token',
      description: 'Token for webhook verification (optional)',
      required: false,
      defaultValue: 'activepieces-ignition-trigger',
    }),
  },
  sampleData: {
    tokenId: 17,
    timestamp: '2025-05-07T22:50:23Z',
    name: 'isIgnitionOn',
    valueNumber: 1,
    valueString: '',
    source: '0xF26421509Efe92861a587482100c6d728aBf1CD0',
    producer: 'did:nft:137:0x9c94C395cBcBDe662235E0A9d3bB87Ad708561BA_31700',
    cloudEventId: '2wmskfxoQk8r4chUZCat7tSnJLN',
  },
  async onEnable(context) {
    const { vehicleTokenIds, ignitionState, triggerFrequency, verificationToken } = context.propsValue;
    
    if (!context.auth.developerJwt) {
      throw new Error('Developer JWT is required for ignition trigger. Please provide a Developer JWT in the authentication configuration.');
    }

    // Build trigger condition for ignition state (1 = ON, 0 = OFF)
    const triggerValue = ignitionState === 'on' ? 1 : 0;
    const triggerCondition = `valueNumber = ${triggerValue}`;

    try {
      // Step 1: Create webhook configuration
      const webhookResponse = await httpClient.sendRequest({
        method: HttpMethod.POST,
        url: 'https://vehicle-events-api.dimo.zone/v1/webhooks',
        body: {
          service: 'Telemetry',
          data: 'isIgnitionOn',
          trigger: triggerCondition,
          setup: triggerFrequency,
          description: `Ignition trigger: ${ignitionState.toUpperCase()}`,
          target_uri: context.webhookUrl,
          status: 'Active',
          verification_token: verificationToken || 'activepieces-ignition-trigger',
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
      throw new Error(`Failed to setup ignition trigger: ${error.message}`);
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

    // Verify this is an ignition event
    if (webhookBody.name !== 'isIgnitionOn') {
      throw new Error('Received non-ignition webhook event');
    }

    const isIgnitionOn = webhookBody.valueNumber === 1;
    const ignitionStatus = isIgnitionOn ? 'ON' : 'OFF';

    // Return the webhook data
    return [
      {
        vehicleTokenId: webhookBody.tokenId,
        timestamp: webhookBody.timestamp,
        signal: webhookBody.name,
        ignitionStatus: ignitionStatus,
        isIgnitionOn: isIgnitionOn,
        rawValue: webhookBody.valueNumber,
        source: webhookBody.source,
        producer: webhookBody.producer,
        eventId: webhookBody.cloudEventId,
        triggerInfo: {
          conditionMet: true,
          actualState: ignitionStatus,
          configuredState: context.propsValue.ignitionState.toUpperCase(),
        },
      },
    ];
  },
}); 