import { Store } from '@activepieces/pieces-framework';
import { mailflossApi, WebhookEvent } from './client';

// Shared by both triggers, so switching a flow from one to the other still
// finds the webhook the previous trigger registered.
const WEBHOOK_ID_KEY = 'mailfloss_webhook_id';

async function enable({
  store,
  apiKey,
  url,
  name,
  event,
}: {
  store: Store;
  apiKey: string;
  url: string;
  name: string;
  event: WebhookEvent;
}): Promise<void> {
  // A republish disables the old trigger with errors ignored, so a failed
  // delete leaves its webhook behind. Remove it first to avoid double deliveries.
  await disable({ store, apiKey });
  const id = await mailflossApi.createWebhook({ apiKey, url, name, event });
  await store.put(WEBHOOK_ID_KEY, id);
}

async function disable({
  store,
  apiKey,
}: {
  store: Store;
  apiKey: string;
}): Promise<void> {
  const id = await store.get<string>(WEBHOOK_ID_KEY);
  if (id) {
    await mailflossApi.deleteWebhook({ apiKey, id });
    await store.delete(WEBHOOK_ID_KEY);
  }
}

export const mailflossWebhook = { enable, disable };
