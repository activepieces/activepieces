import { Store } from '@activepieces/pieces-framework';
import { LinearDocument } from '@linear/sdk';
import { makeClient } from './client';
import { LinearAuth } from './graphql';

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

async function createWebhook({
  client,
  input,
}: {
  client: ReturnType<typeof makeClient>;
  input: LinearDocument.WebhookCreateInput;
}): Promise<string> {
  let payload: Awaited<ReturnType<typeof client.createWebhook>>;
  try {
    payload = await client.createWebhook(input);
  } catch (error) {
    throw toEnableError(error);
  }
  const webhook = payload.success ? await payload.webhook : undefined;
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

const REFUSED_MESSAGE =
  'Linear refused to create the webhook. Webhooks need a personal API key created by a workspace admin, with the Admin permission (or Full access).';

export const linearWebhook = {
  register,
};

type RegisterParams = {
  auth: LinearAuth;
  store: Store;
  storeKey: string;
  input: LinearDocument.WebhookCreateInput;
};

type WebhookInformation = {
  webhookId: string;
  secret?: string;
};
