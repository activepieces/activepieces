import { httpClient } from '@activepieces/pieces-common';
import { VEHICLE_EVENTS_OPERATIONS } from '../../actions/vehicle-events/constant';
import { getHeaders, getNumberExpression, handleFailures, Operator } from '../../helpers';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { developerAuth } from '../../common';
import { WebhookInfo, WebhookPayload } from '../../models';

export const fuelRelativeTrigger = createTrigger({
  auth: developerAuth,
  name: 'fuel_relative_trigger',
  displayName: 'Fuel System Relative Level Trigger',
  description: 'Triggers when vehicle fuel system relative level meets the specified condition - requires Developer JWT',
  type: TriggerStrategy.WEBHOOK,
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description: 'List of vehicle token IDs to monitor (leave empty or select All Vehicles to monitor all vehicles with permissions)',
      required: false,
    }),
    operator: Property.StaticDropdown({
      displayName: 'Operator',
      description: 'How to compare the fuel level percentage',
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
    fuelPercentage: Property.Number({
      displayName: 'Fuel Percentage (%)',
      description: 'The fuel level percentage (0-100%) to compare against',
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
    name: 'powertrainFuelSystemRelativeLevel',
    valueNumber: 25.8,
    valueString: '',
    source: '0xF26421509Efe92861a587482100c6d728aBf1CD0',
    producer: 'did:nft:137:0x9c94C395cBcBDe662235E0A9d3bB87Ad708561BA_31700',
    cloudEventId: '2wmskfxoQk8r4chUZCat7tSnJLN',
  },
  async onEnable(context) {
    const { vehicleTokenIds, operator: comparisonType, fuelPercentage, triggerFrequency, verificationToken } = context.propsValue;

    if (fuelPercentage < 0 || fuelPercentage > 100) {
      throw new Error('Fuel percentage must be between 0 and 100');
    }
    const triggerCondition = getNumberExpression(comparisonType, fuelPercentage);
    const webhookResponse = await httpClient.sendRequest({
      method: VEHICLE_EVENTS_OPERATIONS.createWebhook.method,
      url: VEHICLE_EVENTS_OPERATIONS.createWebhook.url({}),
      body: {
        service: 'Telemetry',
        data: 'powertrainFuelSystemRelativeLevel',
        trigger: triggerCondition,
        setup: triggerFrequency,
        description: `Fuel relative level trigger: ${comparisonType} ${fuelPercentage}%`,
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
    await context.store.put<WebhookInfo>('webhook_info', {
      webhookId,
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInfo>('webhook_info');
    if (!webhookInfo) {
      throw new Error('No webhook info found in store. Trigger may not have been enabled.');
    }
      const res = await httpClient.sendRequest({
        method: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.method,
        url: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.url({ webhookId: webhookInfo.webhookId }),
        headers: getHeaders(context.auth.token),
      });
      handleFailures(res);
  },

  async run(context) {
    const webhookBody = context.payload.body as WebhookPayload;

    // Validate webhook payload structure
    if (!webhookBody || typeof webhookBody !== 'object') {
      throw new Error('Invalid webhook payload');
    }

    const fuelPercentage = webhookBody.valueNumber;

    // Return the webhook data
    return [
      {
        vehicleTokenId: webhookBody.tokenId,
        timestamp: webhookBody.timestamp,
        signal: webhookBody.name,
        fuelPercentage: fuelPercentage,
        rawValue: webhookBody.valueNumber,
        source: webhookBody.source,
        producer: webhookBody.producer,
        eventId: webhookBody.cloudEventId,
        triggerInfo: {
          conditionMet: true,
          comparison: context.propsValue.operator,
          threshold: context.propsValue.fuelPercentage,
          actualValue: fuelPercentage,
          unit: '%',
        },
      },
    ];
  },
});
