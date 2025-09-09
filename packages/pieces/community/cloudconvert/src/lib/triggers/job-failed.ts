import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth } from '../common/auth';
import crypto from 'crypto';

const SIGNING_SECRET_STORE_KEY = 'cc_signing_secret_job_failed';
const WEBHOOK_ID_STORE_KEY = 'cc_webhook_id_job_failed';

export const jobFailed = createTrigger({
  auth: cloudconvertAuth,
  name: 'job_failed',
  displayName: 'Job Failed',
  description: 'Fires when a CloudConvert job has failed.',
  props: {},
  type: TriggerStrategy.WEBHOOK,

  sampleData: {
    event: 'job.failed',
    job: {
      id: 'bba3a621-4f32-4e26-9043-98f519543cd2',
      tag: 'myjob-125',
      status: 'failed',
      tasks: [
        {
          id: 'e4a3b12f-984c-45e1-8314-159e8756184a',
          name: 'convert-1',
          operation: 'convert',
          status: 'error',
          code: 'INPUT_FILE_NOT_FOUND',
          message: 'Could not access input file.',
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
        events: ['job.failed'],
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
    const signingSecret = await context.store.get<string>(
      SIGNING_SECRET_STORE_KEY
    );
    const signature = context.payload.headers[
      'cloudconvert-signature'
    ] as string;

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
      console.warn('Invalid CloudConvert signature received.');
      return [];
    }

    return [context.payload.body];
  },
});
