import { httpClient } from '@activepieces/pieces-common';
import { VEHICLE_EVENTS_OPERATIONS } from '../../actions/vehicle-events/constant';
import { getHeaders, handleFailures } from '../../helpers';
import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { WebhookInfo, WebhookPayload, WebhookDefinition, TriggerField, vehicleEventTriggerToText, NumericTriggerField } from '../../models';
import { operatorStaticDropdown, verificationTokenInput } from '../common';
import { dimoAuth } from '../../../index';
import { WebhookHandshakeStrategy } from '@activepieces/shared';

export const fuelRelativeTrigger = createTrigger({
  auth: dimoAuth,
  name: 'fuel-relative-level-trigger',
  displayName: 'Fuel System Relative Level Trigger',
  description: 'Triggers when vehicle fuel system relative level meets the specified condition - requires Developer JWT',
  type: TriggerStrategy.WEBHOOK,
  handshakeConfiguration : {
    strategy : WebhookHandshakeStrategy.NONE},
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description: 'List of vehicle token IDs to monitor (leave empty or select All Vehicles to monitor all vehicles with permissions)',
      required: false,
    }),
    operator: operatorStaticDropdown,
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
    verificationToken: verificationTokenInput
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
    const { vehicleTokenIds,  operator, fuelPercentage, triggerFrequency, verificationToken } = context.propsValue;
    const { developerJwt } = context.auth;
    if (fuelPercentage < 0 || fuelPercentage > 100) {
      throw new Error('Fuel percentage must be between 0 and 100');
    }
    const webhookDef: WebhookDefinition = {
      service: 'Telemetry',
      data: TriggerField.PowertrainFuelSystemRelativeLevel,
      trigger: {
        field: TriggerField.PowertrainFuelSystemRelativeLevel as NumericTriggerField,
        operator,
        value: fuelPercentage,
      },
      setup: triggerFrequency as 'Realtime' | 'Hourly',
      description: `Fuel relative level trigger: ${operator} ${fuelPercentage}%`,
      targetUri: context.webhookUrl,
      status: 'Active',
    };
    const webhookResponse = await httpClient.sendRequest({
      method: VEHICLE_EVENTS_OPERATIONS.createWebhook.method,
      url: VEHICLE_EVENTS_OPERATIONS.createWebhook.url({}),
      body: {
        service: webhookDef.service,
        data: webhookDef.data,
        trigger: vehicleEventTriggerToText(webhookDef.trigger),
        setup: webhookDef.setup,
        description: webhookDef.description,
        target_uri: webhookDef.targetUri,
        status: webhookDef.status,
        verification_token: verificationToken || 'token',
      },
      headers: getHeaders(developerJwt),
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
            headers: getHeaders(developerJwt),
          });
          handleFailures(res);
        })
      );
    } else {
      const res = await httpClient.sendRequest({
        method: VEHICLE_EVENTS_OPERATIONS.subscribeAllVehicles.method,
        url: VEHICLE_EVENTS_OPERATIONS.subscribeAllVehicles.url({ webhookId }),
        headers: getHeaders(developerJwt),
      });
      handleFailures(res);
    }
    await context.store.put<WebhookInfo>('webhook_info', {
      webhookId,
      verificationToken
    });
  },
  async onDisable(context) {
    const { developerJwt } = context.auth;
    const webhookInfo = await context.store.get<WebhookInfo>('webhook_info');
    if (!webhookInfo) {
      throw new Error('No webhook info found in store. Trigger may not have been enabled.');
    }
    const unsubscribeAllVehicles = await httpClient.sendRequest({
      method: VEHICLE_EVENTS_OPERATIONS.unsubscribeAllVehicles.method,
      url: VEHICLE_EVENTS_OPERATIONS.unsubscribeAllVehicles.url({ webhookId: webhookInfo.webhookId }),
      headers: getHeaders(developerJwt),
    });
    handleFailures(unsubscribeAllVehicles);
    const res = await httpClient.sendRequest({
      method: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.method,
      url: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.url({ webhookId: webhookInfo.webhookId }),
      headers: getHeaders(developerJwt),
    });
    handleFailures(res);
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
          operator: context.propsValue.operator,
          threshold: context.propsValue.fuelPercentage,
          actualValue: fuelPercentage,
          unit: '%',
        },
      },
    ];
  },
});
