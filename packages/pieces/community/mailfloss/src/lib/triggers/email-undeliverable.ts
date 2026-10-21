import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mailflossAuth } from '../auth';
import { mailflossApi } from '../common/client';

const WEBHOOK_ID_KEY = 'mailfloss_undeliverable_webhook_id';

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
    const id = await mailflossApi.createWebhook({
      apiKey: context.auth.secret_text,
      url: context.webhookUrl,
      name: 'Activepieces: Email Undeliverable',
      event: 'status-undeliverable',
    });
    await context.store.put(WEBHOOK_ID_KEY, id);
  },
  async onDisable(context) {
    const id = await context.store.get<string>(WEBHOOK_ID_KEY);
    if (id) {
      await mailflossApi.deleteWebhook({ apiKey: context.auth.secret_text, id });
      await context.store.delete(WEBHOOK_ID_KEY);
    }
  },
  async run(context) {
    return [context.payload.body];
  },
});
