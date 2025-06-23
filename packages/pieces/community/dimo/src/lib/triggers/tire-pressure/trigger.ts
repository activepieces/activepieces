import { httpClient } from '@activepieces/pieces-common';
import {
  createTrigger,
  TriggerStrategy,
  Property,
} from '@activepieces/pieces-framework';
import { WebhookInfo, WebhookPayload, WebhookDefinition, TriggerField, vehicleEventTriggerToText, NumericTriggerField } from '../../models';
import {
  getHeaders,
  handleFailures,
} from '../../helpers';
import { getTirePressurePositionLabel, TirePressurePosition } from './type';
import { VEHICLE_EVENTS_OPERATIONS } from '../../actions/vehicle-events/constant';
import { operatorStaticDropdown, verificationTokenInput } from '../common';
import { dimoAuth } from '../../../index';
import { WebhookHandshakeStrategy } from '@activepieces/shared';

export const tirePressureTrigger = createTrigger({
  auth: dimoAuth,
  name: 'tire-pressure-trigger',
  displayName: 'Tire Pressure Trigger',
  description:
    'Triggers when vehicle tire pressure meets the specified condition - requires Developer JWT',
  type: TriggerStrategy.WEBHOOK,
  handshakeConfiguration: {
    strategy: WebhookHandshakeStrategy.NONE,
  },
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
      defaultValue: TriggerField.ChassisAxleRow1WheelLeftTirePressure,
      options: {
        options: [
          { label: 'Front Left', value: TriggerField.ChassisAxleRow1WheelLeftTirePressure },
          { label: 'Front Right', value: TriggerField.ChassisAxleRow1WheelRightTirePressure },
          { label: 'Rear Left', value: TriggerField.ChassisAxleRow2WheelLeftTirePressure },
          { label: 'Rear Right', value: TriggerField.ChassisAxleRow2WheelRightTirePressure },
        ],
      },
    }),
    operator: operatorStaticDropdown,
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
    verificationToken: verificationTokenInput,
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
      operator,
      pressureKpa,
      triggerFrequency,
      verificationToken,
    } = context.propsValue;
    const { developerJwt } = context.auth;
    // Build trigger condition
    const webhookDef: WebhookDefinition = {
      service: 'Telemetry',
      data: tirePosition,
      trigger: {
        field: tirePosition as NumericTriggerField,
        operator,
        value: pressureKpa,
      },
      setup: triggerFrequency as 'Realtime' | 'Hourly',
      description: `Tire pressure trigger: ${getTirePressurePositionLabel(tirePosition)} ${operator} ${pressureKpa} kPa`,
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
        verification_token: verificationToken
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
            url: VEHICLE_EVENTS_OPERATIONS.subscribeVehicle.url({
              webhookId,
              tokenId: Number(tokenId),
            }),
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
    try {
      const { developerJwt } = context.auth;
      const webhookInfo = await context.store.get<WebhookInfo>('webhook_info');
      if (webhookInfo?.webhookId && developerJwt) {
        // Delete the webhook configuration
        await httpClient.sendRequest({
          method: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.method,
          url: VEHICLE_EVENTS_OPERATIONS.deleteWebhook.url({
            webhookId: webhookInfo.webhookId,
          }),
          headers: getHeaders(developerJwt),
        });
      }
    } catch (error) {
      console.warn('Failed to cleanup webhook:', error);
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
    const tirePosition = webhookBody.name as TriggerField;
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
          operator: context.propsValue.operator,
          threshold: context.propsValue.pressureKpa,
          actualValue: pressureKpa,
          unit: 'kPa',
          monitoredPosition: positionLabel,
        },
      },
    ];
  },
});
