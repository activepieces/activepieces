import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mailflossAuth } from '../auth';
import { mailflossWebhook } from '../common/webhook';

export const emailUndeliverableTrigger = createTrigger({
  auth: mailflossAuth,
  name: 'email_undeliverable',
  classification: 'READ',
  displayName: 'Email Undeliverable',
  description:
    'Triggers when mailfloss marks an email address as undeliverable during verification.',
  aiMetadata: {
    description:
      'Fires once per email address that mailfloss verifies as undeliverable, with the address, its domain, status and reason. Needs a mailfloss plan that includes Webhooks.',
  },
  props: {},
  sampleData: {
    email: 'jane@example.com',
    domain: 'example.com',
    status: 'undeliverable',
    reason: 'nonexistent',
    passed: false,
    processed: true,
    integration: 'api',
    event: 'status.undeliverable',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await mailflossWebhook.enable({
      store: context.store,
      apiKey: context.auth.secret_text,
      url: context.webhookUrl,
      name: 'Activepieces: Email Undeliverable',
      event: 'status-undeliverable',
    });
  },
  async onDisable(context) {
    await mailflossWebhook.disable({
      store: context.store,
      apiKey: context.auth.secret_text,
    });
  },
  async run(context) {
    return [context.payload.body];
  },
});
