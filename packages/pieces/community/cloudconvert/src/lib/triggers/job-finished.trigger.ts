import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth } from '../common/auth';
import crypto from 'crypto';

const SIGNING_SECRET_STORE_KEY = 'cloudconvert_signing_secret';
const WEBHOOK_ID_STORE_KEY = 'cloudconvert_webhook_id';

export const jobFinished = createTrigger({
  auth: cloudconvertAuth,
  name: 'job_finished_secure',
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
    const response = await httpClient.sendRequest<{
      data: { id: string; signing_secret: string };
    }>({
      method: HttpMethod.POST,
      url: 'https://api.cloudconvert.com/v2/webhooks',
      headers: { Authorization: `Bearer ${context.auth}` },
      body: {
        url: context.webhookUrl,
        events: ['job.finished'],
      },
    });

    await context.store.put(WEBHOOK_ID_STORE_KEY, response.body.data.id);
    await context.store.put(
      SIGNING_SECRET_STORE_KEY,
      response.body.data.signing_secret
    );
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>(WEBHOOK_ID_STORE_KEY);
    if (webhookId) {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `https://api.cloudconvert.com/v2/webhooks/${webhookId}`,
        headers: { Authorization: `Bearer ${context.auth}` },
      });
    }
    await context.store.delete(WEBHOOK_ID_STORE_KEY);
    await context.store.delete(SIGNING_SECRET_STORE_KEY);
  },

  async run(context) {
    const signingSecret = await context.store.get<string>(SIGNING_SECRET_STORE_KEY);
    const signature = context.payload.headers['cloudconvert-signature'] as string;

    const bodyToHash =
      typeof context.payload.rawBody === 'string'
        ? context.payload.rawBody
        : JSON.stringify(context.payload.body ?? {});

    if (!signingSecret || !signature) {
      return [];
    }
    
    const computedSignature = crypto
      .createHmac('sha256', signingSecret)
      .update(bodyToHash) 
      .digest('hex');
    
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computedSignature)
    );

    if (!isValid) {
      console.warn("Invalid CloudConvert signature received.");
      return [];
    }

    return [context.payload.body];
  },
});
