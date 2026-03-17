import { createTrigger, Property, TriggerStrategy } from '@activepieces/pieces-framework';
import { dimoDeveloperAuth, DimoAuthProps } from '../common/auth';
import {
  createDimoWebhook,
  deleteDimoWebhook,
  subscribeAllVehicles,
  generateVerificationToken,
  StoredWebhookInfo,
} from './common';

export const dimoIgnitionTrigger = createTrigger({
  auth: dimoDeveloperAuth,
  name: 'trigger_ignition',
  displayName: 'Vehicle Ignition Status Changed',
  description: 'Triggers when a vehicle ignition is turned ON or OFF.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    state: Property.StaticDropdown({
      displayName: 'Ignition State',
      description: 'The ignition state to trigger on.',
      required: true,
      options: {
        options: [
          { label: 'Ignition ON', value: 'on' },
          { label: 'Ignition OFF', value: 'off' },
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
    signal: 'isIgnitionOn',
    value: true,
    timestamp: '2024-01-15T08:00:00Z',
  },
  async onEnable(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;

    if (!developerJwt) {
      throw new Error('Developer JWT is required for webhook triggers.');
    }

    const { state, cool_down_period, subscribe_all } = context.propsValue;
    const verificationToken = generateVerificationToken();

    const conditionExpr = state === 'on' ? '$ == true' : '$ == false';
    const stateLabel = state === 'on' ? 'ON' : 'OFF';

    const webhook = await createDimoWebhook(developerJwt, {
      service: 'vehicle-signal-decoding',
      metricName: 'isIgnitionOn',
      condition: conditionExpr,
      coolDownPeriod: cool_down_period ?? 60,
      targetURL: context.webhookUrl,
      status: 'active',
      verificationToken,
      displayName: `Activepieces Ignition ${stateLabel} Trigger`,
    });

    if (subscribe_all !== false) {
      try {
        await subscribeAllVehicles(developerJwt, webhook.id);
      } catch (e) {
        console.warn('Failed to subscribe all vehicles:', e);
      }
    }

    await context.store.put<StoredWebhookInfo>('_dimo_ignition_trigger', {
      webhookId: webhook.id,
      verificationToken,
    });
  },
  async onDisable(context) {
    const auth = context.auth as DimoAuthProps;
    const developerJwt = auth.developer_jwt;
    if (!developerJwt) return;

    const stored = await context.store.get<StoredWebhookInfo>('_dimo_ignition_trigger');
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
        signal: 'isIgnitionOn',
        value: true,
        timestamp: new Date().toISOString(),
      },
    ];
  },
});
