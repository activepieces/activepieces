import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mailflossAuth } from '../auth';
import { mailflossApi } from '../common/client';

export const startBatchVerificationAction = createAction({
  auth: mailflossAuth,
  name: 'start_batch_verification',
  classification: 'WRITE',
  displayName: 'Start Batch Verification',
  description: 'Send a list of email addresses to verify in the background.',
  audience: 'both',
  aiMetadata: {
    description:
      'Queues a list of email addresses for background verification and returns the job ID. Use Get Batch Status to check progress and Get Batch Results to read the verdicts; use Verify Email for a single address. Each call starts a new job and uses credits, so retries duplicate work.',
    idempotent: false,
  },
  props: {
    emails: Property.Array({
      displayName: 'Emails',
      description:
        'The email addresses to verify. An item can also hold several addresses separated by commas or new lines.',
      required: true,
    }),
    webhookUrl: Property.ShortText({
      displayName: 'Callback URL',
      description:
        'Optional. mailfloss sends the finished job to this URL. Leave it empty to check progress with Get Batch Status instead.',
      required: false,
    }),
  },
  async run(context) {
    const emails = context.propsValue.emails
      .flatMap((item) => String(item).split(/[,\n]/))
      .map((email) => email.trim())
      .filter((email) => email.length > 0);
    if (emails.length === 0) {
      throw new Error('Add at least one email address to verify.');
    }
    const webhookUrl = context.propsValue.webhookUrl?.trim();
    return mailflossApi.send<{ id: string }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/batch-verify',
      body: { emails, ...(webhookUrl ? { webhook_url: webhookUrl } : {}) },
    });
  },
});
