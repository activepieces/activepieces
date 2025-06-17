import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { getHeaders, handleFailures } from '../../helpers';
import {  TriggerField, WebhookDefinition, WebhookInfo, WebhookPayload } from '../../models';
import { VEHICLE_EVENTS_OPERATIONS } from '../../actions/vehicle-events/constant';
import { operatorStaticDropdown, verificationTokenInput } from '../common';
import { dimoAuth } from '../../../index';

export const speedTrigger = createTrigger({
  auth: dimoAuth,
  name: 'speed-trigger',
  displayName: 'Speed Trigger',
  description:
    'Triggers when vehicle speed meets specified conditions (requires Developer JWT)',
  type: TriggerStrategy.WEBHOOK,
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description:
        'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions)',
      required: false,
    }),
    operator: operatorStaticDropdown,
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
          { label: 'Real-time', value: 'Realtime' },
          { label: 'Hourly', value: 'Hourly' },
        ],
      },
    }),
    verificationToken: verificationTokenInput,
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
    const {
      vehicleTokenIds,
      operator,
      speedValue,
      triggerFrequency,
      verificationToken,
    } = context.propsValue;
    const { developerJwt } = context.auth;
    const ids: string[] =
      vehicleTokenIds &&
      Array.isArray(vehicleTokenIds) &&
      vehicleTokenIds.length > 0
        ? vehicleTokenIds.map(String)
        : [];
    const webhookDef: WebhookDefinition = {
      service: 'Telemetry',
      data: TriggerField.Speed,
      trigger: {
        field: TriggerField.Speed,
        operator,
        value: speedValue,
      },
      setup: triggerFrequency as 'Realtime' | 'Hourly',
      description: `Speed trigger: ${operator} ${speedValue} km/h`,
      targetUri: context.webhookUrl,
      status: 'Active',
    };
    // Create Webhook
    const webhookResponse = await httpClient.sendRequest({
      method: VEHICLE_EVENTS_OPERATIONS.createWebhook.method,
      url: VEHICLE_EVENTS_OPERATIONS.createWebhook.url({}),
      body: {
        service: webhookDef.service,
        data: webhookDef.data,
        trigger: webhookDef.trigger,
        setup: webhookDef.setup,
        description: webhookDef.description,
        target_uri: webhookDef.targetUri,
        status: webhookDef.status,
        verification_token: verificationToken
      },
      headers: getHeaders({ developerJwt }, 'developer'),
    });
    handleFailures(webhookResponse);
    const webhookId = webhookResponse.body.id;
    if (ids.length === 0) {
      const res = await httpClient.sendRequest({
        method: VEHICLE_EVENTS_OPERATIONS.subscribeAllVehicles.method,
        url: VEHICLE_EVENTS_OPERATIONS.subscribeAllVehicles.url({ webhookId }),
        headers: getHeaders({ developerJwt }, 'developer'),
      });
      handleFailures(res);
    } else {
      await Promise.all(
        ids.map(async (tokenId) => {
          const res = await httpClient.sendRequest({
            method: VEHICLE_EVENTS_OPERATIONS.subscribeVehicle.method,
            url: VEHICLE_EVENTS_OPERATIONS.subscribeVehicle.url({ webhookId, tokenId: Number(tokenId) }),
            headers: getHeaders({ developerJwt }, 'developer'),
          });
          handleFailures(res);
        })
      );
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
      throw new Error(
        'No webhook info found in store. Trigger may not have been enabled.'
      );
    }
    const res = await httpClient.sendRequest({
      method: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.method,
      url: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.url({ webhookId: webhookInfo.webhookId }),
      headers: getHeaders({ developerJwt }, 'developer'),
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
    if (!webhookBody || typeof webhookBody !== 'object') {
      throw new Error('Invalid webhook payload');
    }
    if (webhookBody.name !== TriggerField.Speed) {
      throw new Error('Received non-speed webhook event');
    }
    return [
      {
        ...webhookBody,
        triggerInfo: {
          conditionMet: true,
          actualValue: webhookBody.valueNumber,
          configuredOperator: context.propsValue.operator,
          configuredValue: context.propsValue.speedValue,
        },
      },
    ];
  },
});
