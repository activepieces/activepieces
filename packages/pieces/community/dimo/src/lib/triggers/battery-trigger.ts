import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { dimoDeveloperAuth, DimoAuthProps } from '../common/auth';
import {
  createDimoWebhook,
  deleteDimoWebhook,
  subscribeAllVehicles,
  generateVerificationToken,
  StoredWebhookInfo,
} from './common';

export const dimoBatteryPowerTrigger = createTrigger({
  auth: dimoDeveloperAuth,
  name: 'trigger_battery_power',
  displayName: 'Battery Current Power Alert',
  description: 'Triggers when a vehicle battery current power (charge/discharge rate) meets a condition.',
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
      displayName: 'Power Value (Watts)',
      description: 'The battery power threshold in Watts. Negative = discharging, Positive = charging.',
      required: true,
    }),
    cool_down_period: Property.Number({
      displayName: 'Cool Down Period (seconds)',
      description: 'Minimum seconds between trigger events for the same vehicle (default: 300).',
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
    signal: 'powertrainTractionBatteryCurrentPower',
    value: -50000,
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
      metricName: 'powertrainTractionBatteryCurrentPower',
      condition: conditionExpr,
      coolDownPeriod: cool_down_period ?? 300,
      targetURL: context.webhookUrl,
      status: 'active',
      verificationToken,
      displayName: `Activepieces Battery Power Trigger (${conditionExpr} W)`,
    });

    if (subscribe_all !== false) {
      try {
        await subscribeAllVehicles(developerJwt, webhook.id);
      } catch (e) {
        console.warn('Failed to subscribe all vehicles:', e);
      }
    }

    await context.store.put<StoredWebhookInfo>('_dimo_battery_power_trigger', {
      webhookId: webhook.id,
      verificationToken,
    });
  },
  async onDisable(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;
    if (!developerJwt) return;

    const stored = await context.store.get<StoredWebhookInfo>('_dimo_battery_power_trigger');
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
        signal: 'powertrainTractionBatteryCurrentPower',
        value: -50000,
        timestamp: new Date().toISOString(),
      },
    ];
  },
});

export const dimoBatteryChargingTrigger = createTrigger({
  auth: dimoDeveloperAuth,
  name: 'trigger_battery_charging',
  displayName: 'Battery Charging Status Changed',
  description: 'Triggers when a vehicle starts or stops charging.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    charging_state: Property.StaticDropdown({
      displayName: 'Charging State',
      description: 'The charging state to trigger on.',
      required: true,
      options: {
        options: [
          { label: 'Charging Started (True)', value: 'true' },
          { label: 'Charging Stopped (False)', value: 'false' },
        ],
      },
    }),
    cool_down_period: Property.Number({
      displayName: 'Cool Down Period (seconds)',
      description: 'Minimum seconds between trigger events for the same vehicle (default: 60).',
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
    signal: 'powertrainTractionBatteryChargingIsCharging',
    value: true,
    timestamp: '2024-01-15T21:00:00Z',
  },
  async onEnable(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for webhook triggers.');
    }

    const { charging_state, cool_down_period, subscribe_all } = context.propsValue;
    const verificationToken = generateVerificationToken();

    const conditionExpr = `$ == ${charging_state}`;
    const stateLabel = charging_state === 'true' ? 'Started' : 'Stopped';

    const webhook = await createDimoWebhook(developerJwt, {
      service: 'vehicle-signal-decoding',
      metricName: 'powertrainTractionBatteryChargingIsCharging',
      condition: conditionExpr,
      coolDownPeriod: cool_down_period ?? 60,
      targetURL: context.webhookUrl,
      status: 'active',
      verificationToken,
      displayName: `Activepieces Charging ${stateLabel} Trigger`,
    });

    if (subscribe_all !== false) {
      try {
        await subscribeAllVehicles(developerJwt, webhook.id);
      } catch (e) {
        console.warn('Failed to subscribe all vehicles:', e);
      }
    }

    await context.store.put<StoredWebhookInfo>('_dimo_battery_charging_trigger', {
      webhookId: webhook.id,
      verificationToken,
    });
  },
  async onDisable(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;
    if (!developerJwt) return;

    const stored = await context.store.get<StoredWebhookInfo>('_dimo_battery_charging_trigger');
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
        signal: 'powertrainTractionBatteryChargingIsCharging',
        value: true,
        timestamp: new Date().toISOString(),
      },
    ];
  },
});
