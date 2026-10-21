import { Store } from '@activepieces/pieces-framework';
import { mailflossApi, WebhookEvent } from './client';

async function enable({
  store,
  storeKey,
  apiKey,
  url,
  name,
  event,
}: {
  store: Store;
  storeKey: string;
  apiKey: string;
  url: string;
  name: string;
  event: WebhookEvent;
}): Promise<void> {
  // A republish disables the old trigger with errors ignored, so a failed
  // delete leaves its webhook behind. Remove it first to avoid double deliveries.
  await disable({ store, storeKey, apiKey });
  const id = await mailflossApi.createWebhook({ apiKey, url, name, event });
  await store.put(storeKey, id);
}

async function disable({
  store,
  storeKey,
  apiKey,
}: {
  store: Store;
  storeKey: string;
  apiKey: string;
}): Promise<void> {
  const id = await store.get<string>(storeKey);
  if (id) {
    await mailflossApi.deleteWebhook({ apiKey, id });
    await store.delete(storeKey);
  }
}

export const mailflossWebhook = { enable, disable };
