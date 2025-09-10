import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { cloudconvertAuth } from '../common/auth';
import { cloudConvertApiService } from '../common/api';

const WEBHOOK_ID_STORE_KEY = 'cc_webhook_id_job_finished';
const SIGNING_SECRET_STORE_KEY = 'cc_signing_secret_job_finished';

export const jobFinished = createTrigger({
  auth: cloudconvertAuth,
  name: 'job_finished',
  displayName: 'Job Finished',
  description: 'Fires when a CloudConvert job has been completed.',
  props: {},
  type: TriggerStrategy.WEBHOOK,
  sampleData: {
    event: 'job.finished',
    job: {
      id: '4b6ee8e2-e293-4805-b48e-a03876d1ec66',
      tag: 'myjob-123',
      status: 'finished',
      tasks: [
        {
          id: 'acdf8096-10a1-4ab7-b009-539f5f329cad',
          name: 'export-1',
          operation: 'export/url',
          status: 'finished',
          result: {
            files: [
              {
                filename: 'file.pdf',
                url: 'https://storage.cloudconvert.com/...',
              },
            ],
          },
        },
      ],
    },
  },

  async onEnable(context) {
    const response = await cloudConvertApiService.createWebhook(
      context.auth,
      context.webhookUrl,
      ['job.finished']
    );
    await context.store.put(WEBHOOK_ID_STORE_KEY, response.body.data.id);
    await context.store.put(
      SIGNING_SECRET_STORE_KEY,
      response.body.data.signing_secret
    );
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>(WEBHOOK_ID_STORE_KEY);
    if (webhookId) {
      await cloudConvertApiService.deleteWebhook(context.auth, webhookId);
    }
    await context.store.delete(WEBHOOK_ID_STORE_KEY);
    await context.store.delete(SIGNING_SECRET_STORE_KEY);
  },

  async run(context) {
    const isValid = await cloudConvertApiService.validateSignature(
      context,
      'job_finished'
    );

    if (!isValid) {
      console.warn('Invalid CloudConvert signature received.');
      return [];
    }
    return [context.payload.body];
  },
});
