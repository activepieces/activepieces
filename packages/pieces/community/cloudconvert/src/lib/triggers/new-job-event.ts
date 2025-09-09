import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { cloudconvertAuth } from '../common/auth';
import crypto from 'crypto';

const SIGNING_SECRET_STORE_KEY = 'cc_signing_secret_new_job';
const WEBHOOK_ID_STORE_KEY = 'cc_webhook_id_new_job';

export const newJobEvent = createTrigger({
  auth: cloudconvertAuth,
  name: 'new_job_event',
  displayName: 'New Job Event',
  description: 'Fires when a new job has been created.',
  props: {},
  type: TriggerStrategy.WEBHOOK,

  sampleData: {
    event: 'job.created',
    job: {
      id: 'a4d33455-1507-4b21-b388-3f1011568a88',
      tag: 'myjob-124',
      status: 'waiting',
      created_at: '2025-09-09T10:30:00+00:00',
      started_at: null,
      ended_at: null,
      tasks: [
        {
          id: 'e3b4a21f-873b-45e0-8314-159e8756184a',
          name: 'import-1',
          operation: 'import/url',
          status: 'waiting',
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
        events: ['job.created'],
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
