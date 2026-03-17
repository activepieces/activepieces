import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { dimoDeveloperAuth, DimoAuthProps } from '../common/auth';
import {
  createDimoWebhook,
  deleteDimoWebhook,
  subscribeAllVehicles,
  generateVerificationToken,
  StoredWebhookInfo,
} from './common';

export const dimoOdometerTrigger = createTrigger({
  auth: dimoDeveloperAuth,
  name: 'trigger_odometer',
  displayName: 'Vehicle Odometer Alert',
  description: 'Triggers when a vehicle odometer reading meets a specified condition.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    condition: Property.StaticDropdown({
      displayName: 'Condition',
      description: 'The comparison condition.',
      required: true,
      options: {
        options: [
          { label: 'Equal to', value: 'eq' },
          { label: 'Greater than', value: 'gt' },
          { label: 'Less than', value: 'lt' },
        ],
      },
    }),
    value: Property.Number({
      displayName: 'Distance Value (km)',
      description: 'The odometer threshold value in kilometers.',
      required: true,
    }),
    cool_down_period: Property.Number({
      displayName: 'Cool Down Period (seconds)',
      description: 'Minimum seconds between trigger events for the same vehicle (default: 3600).',
      required: false,
    }),
    subscribe_all: Property.Checkbox({
      displayName: 'Subscribe All Vehicles',
      description: 'Automatically subscribe all vehicles with permissions to this trigger.',
      required: false,
      defaultValue: true,
    }),
  },
  sampleData: {
    vehicleTokenId: 12345,
    signal: 'powertrainTransmissionTravelledDistance',
    value: 50000,
    timestamp: '2024-01-15T10:30:00Z',
  },
  async onEnable(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for webhook triggers.');
    }

    const { condition, value, cool_down_period, subscribe_all } = context.propsValue;
    const verificationToken = generateVerificationToken();

    let conditionExpr: string;
    switch (condition) {
      case 'eq': conditionExpr = `$ == ${value}`; break;
      case 'gt': conditionExpr = `$ > ${value}`; break;
      case 'lt': conditionExpr = `$ < ${value}`; break;
      default: conditionExpr = `$ > ${value}`;
    }

    const webhook = await createDimoWebhook(developerJwt, {
      service: 'vehicle-signal-decoding',
      metricName: 'powertrainTransmissionTravelledDistance',
      condition: conditionExpr,
      coolDownPeriod: cool_down_period ?? 3600,
      targetURL: context.webhookUrl,
      status: 'active',
      verificationToken,
      displayName: `Activepieces Odometer Trigger (${conditionExpr} km)`,
    });

    if (subscribe_all !== false) {
      try {
        await subscribeAllVehicles(developerJwt, webhook.id);
      } catch (e) {
        console.warn('Failed to subscribe all vehicles:', e);
      }
    }

    await context.store.put<StoredWebhookInfo>('_dimo_odometer_trigger', {
      webhookId: webhook.id,
      verificationToken,
    });
  },
  async onDisable(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;
    if (!developerJwt) return;

    const stored = await context.store.get<StoredWebhookInfo>('_dimo_odometer_trigger');
    if (stored?.webhookId) {
      await deleteDimoWebhook(developerJwt, stored.webhookId);
    }
  },
  async run(context) {
    const body = context.payload.body as Record<string, unknown>;
    return [body];
  },
  async test(_context) {
    return [
      {
        vehicleTokenId: 12345,
        signal: 'powertrainTransmissionTravelledDistance',
        value: 50000,
        timestamp: new Date().toISOString(),
      },
    ];
  },
});
