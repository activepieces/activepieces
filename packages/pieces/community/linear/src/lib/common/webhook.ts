import { Store } from '@activepieces/pieces-framework';
import { LinearDocument } from '@linear/sdk';
import { makeClient } from './client';
import { LinearAuth, linearGraphql } from './graphql';
import { WEBHOOK_CREATE_MUTATION } from './queries';

async function register({ auth, store, storeKey, input }: RegisterParams): Promise<string> {
  const client = makeClient(auth);
  const webhookId = await createWebhook({ client, input });
  try {
    await store.put<WebhookInformation>(storeKey, { webhookId, ...(input.secret ? { secret: input.secret } : {}) });
  } catch (error) {
    await client.deleteWebhook(webhookId).catch(() => undefined);
    throw error;
  }
  return webhookId;
}

async function unregister({ auth, store, storeKey }: UnregisterParams): Promise<void> {
  const stored = await store.get<WebhookInformation>(storeKey);
  if (stored?.webhookId) {
    await deleteWebhookIfPresent({ client: makeClient(auth), webhookId: stored.webhookId });
  }
  await store.delete(storeKey);
}

async function createWebhook({
  client,
  input,
}: {
  client: ReturnType<typeof makeClient>;
  input: LinearDocument.WebhookCreateInput;
}): Promise<string> {
  const result = await client.typedRequest<WebhookCreateData>(WEBHOOK_CREATE_MUTATION, { input }).catch((error: unknown) => {
    throw toEnableError(error);
  });
  const payload = result.data?.webhookCreate;
  const webhook = payload?.success === true ? payload.webhook : undefined;
  if (!webhook?.id) {
    throw new Error(REFUSED_MESSAGE);
  }
  return webhook.id;
}

function toEnableError(error: unknown): Error {
  const type = typeof error === 'object' && error !== null && 'type' in error ? error.type : undefined;
  if (type === 'Forbidden' || type === 'AuthenticationError') {
    return new Error(REFUSED_MESSAGE);
  }
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`Linear could not create the webhook: ${message}`);
}

async function deleteWebhookIfPresent({
  client,
  webhookId,
}: {
  client: ReturnType<typeof makeClient>;
  webhookId: string;
}): Promise<void> {
  try {
    await client.deleteWebhook(webhookId);
  } catch (error) {
    if (!linearGraphql.isNotFoundError(error)) {
      throw error;
    }
  }
}

const REFUSED_MESSAGE =
  'Linear refused to create the webhook. Webhooks need a personal API key created by a workspace admin, with the Admin permission (or Full access).';

export const linearWebhook = {
  register,
  unregister,
};

type RegisterParams = {
  auth: LinearAuth;
  store: Store;
  storeKey: string;
  input: LinearDocument.WebhookCreateInput;
};

type UnregisterParams = {
  auth: LinearAuth;
  store: Store;
  storeKey: string;
};

type WebhookCreateData = {
  webhookCreate: { success: boolean; webhook: { id: string } | null } | null;
};

type WebhookInformation = {
  webhookId: string;
  secret?: string;
};
