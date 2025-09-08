import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { cloudConvertAuth } from '../auth';
import { createWebhook, deleteWebhook } from '../common/client';
import { getRawBodyFallback, verifyCloudConvertSignature } from './_common';

const STORE_KEY = 'cloudconvert_webhook_job_created';

export const jobCreated = createTrigger({
  auth: cloudConvertAuth,
  name: 'job_created',
  displayName: 'New Job Event',
  description: 'Fires when a new job has been created.',
  type: TriggerStrategy.WEBHOOK,
  props: {},
  sampleData: {
    event: 'job.created',
    data: {
      id: 'job_123',
      status: 'pending',
    },
  },
  async onEnable(context) {
    const auth = context.auth as string;
    const endpointOverride = undefined; // use default
    const hook = await createWebhook({
      auth,
      webhookUrl: context.webhookUrl,
      events: ['job.created'],
      endpointOverride,
    });
    await context.store?.put(STORE_KEY, {
      id: hook.id,
      signing_secret: hook.signing_secret,
    });
  },
  async onDisable(context) {
    const saved = (await context.store?.get(STORE_KEY)) as { id?: string } | null;
    if (saved?.id) {
      const auth = context.auth as string;
      await deleteWebhook({ auth, webhookId: saved.id });
    }
  },
  async run(context) {
    
    const saved = (await context.store?.get(STORE_KEY)) as { signing_secret?: string } | null;
    const signature = context.payload.headers?.['cloudconvert-signature'] as string | undefined;
    const raw = (context.payload as any).rawBody ?? getRawBodyFallback(context.payload.body);
    const ok = verifyCloudConvertSignature({
      rawBody: raw,
      signatureHeader: signature,
      signingSecret: saved?.signing_secret,
    });
    if (saved?.signing_secret && !ok) {
   
      return [];
    }
    return [context.payload.body];
  },
});