import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient } from '@activepieces/pieces-common';
import { WebhookInfo, WebhookPayload } from '../../models';
import { VEHICLE_EVENTS_OPERATIONS } from '../../actions';
import { getHeaders, handleFailures } from '../../helpers';
import { verificationTokenInput } from '../common';
import { developerAuth } from '../../../index';

export const ignitionTrigger = createTrigger({
  auth: developerAuth,
  name: 'ignition-trigger',
  displayName: 'Ignition Status Trigger',
  description:
    'Triggers when vehicle ignition status changes (ON/OFF) - requires Developer JWT',
  type: TriggerStrategy.WEBHOOK,
  props: {
    vehicleTokenIds: Property.Array({
      displayName: 'Vehicle Token IDs',
      description:
        'List of vehicle token IDs to monitor (leave empty to monitor all vehicles with permissions)',
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
    verificationToken: verificationTokenInput,
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
    const {
      vehicleTokenIds,
      ignitionState,
      triggerFrequency,
      verificationToken,
    } = context.propsValue;
    const triggerValue = ignitionState.toLowerCase() === 'on' ? 1 : 0;

    // Step 1: Create webhook configuration
    const webhookResponse = await httpClient.sendRequest({
      method: VEHICLE_EVENTS_OPERATIONS.createWebhook.method,
      url: VEHICLE_EVENTS_OPERATIONS.createWebhook.url({}),
      body: {
        service: 'Telemetry',
        data: 'isIgnitionOn',
        trigger: `valueNumber = ${triggerValue}`,
        setup: triggerFrequency,
        description: `Ignition trigger: ${ignitionState.toUpperCase()}`,
        target_uri: context.webhookUrl,
        status: 'Active',
        verification_token: verificationToken
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
    await context.store.put<WebhookInfo>('webhook_info', {
      webhookId,
      verificationToken
    });
  },
  async onDisable(context) {
    const webhookInfo = await context.store.get<WebhookInfo>('webhook_info');
    if (webhookInfo?.webhookId && context.auth.token) {
      const res = await httpClient.sendRequest({
        method: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.method,
        url: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.url({
          webhookId: webhookInfo.webhookId,
        }),
        headers: getHeaders(context.auth.token),
      });
      handleFailures(res);
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
