import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { mailflossAuth } from '../auth';
import { mailflossWebhook } from '../common/webhook';

export const verificationJobFinishedTrigger = createTrigger({
  auth: mailflossAuth,
  name: 'verification_job_finished',
  classification: 'READ',
  displayName: 'Verification Job Finished',
  description: 'Triggers when mailfloss finishes a verification job.',
  aiMetadata: {
    description:
      'Fires once each time a mailfloss verification job finishes, with the job ID and its verdict counts. Needs a mailfloss plan that includes Webhooks.',
  },
  props: {},
  sampleData: {
    id: 'job_a1b2c3d4e5f6g7h8',
    processed: true,
    status: 'processed',
    finished_at: '2026-10-21T10:18:22.000Z',
    stats: {
      total: 1000,
      passed: 870,
      failed: 130,
      statuses: { undeliverable: 80, risky: 30, unknown: 20 },
      categories: {
        invalid: 12,
        illegitimate: 0,
        spam: 0,
        failed_exchange: 3,
        role: 18,
        banned: 0,
        disposable: 9,
        available: 0,
        unverified: 0,
        blacklisted: 0,
        bounced: 2,
        complained: 1,
        deactivated: 4,
        inbox_full: 1,
        accept_all: 20,
        nonexistent: 60,
      },
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    await mailflossWebhook.enable({
      store: context.store,
      apiKey: context.auth.secret_text,
      url: context.webhookUrl,
      name: 'Activepieces: Verification Job Finished',
      event: 'job-finished',
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
