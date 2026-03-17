import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { dimoDeveloperAuth, DimoAuthProps } from '../common/auth';
import {
  createDimoWebhook,
  deleteDimoWebhook,
  subscribeAllVehicles,
  generateVerificationToken,
  StoredWebhookInfo,
} from './common';

const TIRE_SIGNAL_MAP: Record<string, string> = {
  front_left: 'chassisAxleRow1WheelLeftTirePressure',
  front_right: 'chassisAxleRow1WheelRightTirePressure',
  rear_left: 'chassisAxleRow2WheelLeftTirePressure',
  rear_right: 'chassisAxleRow2WheelRightTirePressure',
};

export const dimoTirePressureTrigger = createTrigger({
  auth: dimoDeveloperAuth,
  name: 'trigger_tire_pressure',
  displayName: 'Tire Pressure Alert',
  description: 'Triggers when a vehicle tire pressure meets a specified condition.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    tire_position: Property.StaticDropdown({
      displayName: 'Tire Position',
      description: 'Which tire to monitor.',
      required: true,
      options: {
        options: [
          { label: 'Front Left', value: 'front_left' },
          { label: 'Front Right', value: 'front_right' },
          { label: 'Rear Left', value: 'rear_left' },
          { label: 'Rear Right', value: 'rear_right' },
        ],
      },
    }),
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
      displayName: 'Pressure Value (kPa)',
      description: 'The tire pressure threshold in kilopascals (kPa). Normal range: 200-250 kPa.',
      required: true,
    }),
    cool_down_period: Property.Number({
      displayName: 'Cool Down Period (seconds)',
      description: 'Minimum seconds between trigger events for the same vehicle (default: 1800).',
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
    signal: 'chassisAxleRow1WheelLeftTirePressure',
    value: 185,
    timestamp: '2024-01-15T07:30:00Z',
  },
  async onEnable(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for webhook triggers.');
    }

    const { tire_position, condition, value, cool_down_period, subscribe_all } = context.propsValue;
    const verificationToken = generateVerificationToken();
    const metricName = TIRE_SIGNAL_MAP[tire_position] ?? TIRE_SIGNAL_MAP['front_left'];

    let conditionExpr: string;
    switch (condition) {
      case 'eq': conditionExpr = `$ == ${value}`; break;
      case 'gt': conditionExpr = `$ > ${value}`; break;
      case 'lt': conditionExpr = `$ < ${value}`; break;
      default: conditionExpr = `$ < ${value}`;
    }

    const tireLabel = tire_position.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase());

    const webhook = await createDimoWebhook(developerJwt, {
      service: 'vehicle-signal-decoding',
      metricName,
      condition: conditionExpr,
      coolDownPeriod: cool_down_period ?? 1800,
      targetURL: context.webhookUrl,
      status: 'active',
      verificationToken,
      displayName: `Activepieces Tire Pressure ${tireLabel} Trigger (${conditionExpr} kPa)`,
    });

    if (subscribe_all !== false) {
      try {
        await subscribeAllVehicles(developerJwt, webhook.id);
      } catch (e) {
        console.warn('Failed to subscribe all vehicles:', e);
      }
    }

    await context.store.put<StoredWebhookInfo>('_dimo_tire_pressure_trigger', {
      webhookId: webhook.id,
      verificationToken,
    });
  },
  async onDisable(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;
    if (!developerJwt) return;

    const stored = await context.store.get<StoredWebhookInfo>('_dimo_tire_pressure_trigger');
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
        signal: 'chassisAxleRow1WheelLeftTirePressure',
        value: 185,
        timestamp: new Date().toISOString(),
      },
    ];
  },
});
