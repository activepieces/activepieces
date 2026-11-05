import { HttpError, httpClient, HttpMethod } from '@activepieces/pieces-common';
import {
  createTrigger,
  isNil,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import {
  SHOPIFY_API_VERSION,
  ShopifyAuth,
  shopifyAuth,
  shopifyAuthHelpers,
} from './auth';

export const createShopifyWebhookTrigger = ({
  name,
  description,
  aiMetadata,
  displayName,
  sampleData,
  topic,
}: {
  name: string;
  description: string;
  aiMetadata?: { description: string };
  displayName: string;
  topic: string;
  sampleData: Record<string, unknown>;
}) =>
  createTrigger({
    auth: shopifyAuth,
    name,
    classification: 'READ',
    description,
    aiMetadata,
    displayName,
    props: {},
    sampleData: sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const webhookId = await createOrFindWebhook({
        auth: context.auth,
        topic,
        address: context.webhookUrl,
      });
      await context.store.put(WEBHOOK_ID_KEY, webhookId);
    },
    async onDisable(context) {
      const webhookId = await context.store.get<number>(WEBHOOK_ID_KEY);
      if (isNil(webhookId)) {
        return;
      }
      await deleteWebhook({ auth: context.auth, webhookId });
      await context.store.delete(WEBHOOK_ID_KEY);
    },
    async run(context) {
      return [context.payload.body];
    },
  });

async function createOrFindWebhook({
  auth,
  topic,
  address,
}: {
  auth: ShopifyAuth;
  topic: string;
  address: string;
}): Promise<number> {
  try {
    const response = await httpClient.sendRequest<{ webhook: ShopifyWebhook }>({
      method: HttpMethod.POST,
      url: `${webhooksUrl({ auth })}.json`,
      headers: shopifyAuthHelpers.getAuthHeaders(auth),
      body: {
        webhook: {
          topic,
          address,
          format: 'json',
        },
      },
    });
    return response.body.webhook.id;
  } catch (error) {
    if (!(error instanceof HttpError) || error.response.status !== 422) {
      throw error;
    }
    const existing = await findWebhook({ auth, topic, address });
    if (isNil(existing)) {
      throw error;
    }
    return existing.id;
  }
}

async function findWebhook({
  auth,
  topic,
  address,
}: {
  auth: ShopifyAuth;
  topic: string;
  address: string;
}): Promise<ShopifyWebhook | undefined> {
  const response = await httpClient.sendRequest<{ webhooks: ShopifyWebhook[] }>({
    method: HttpMethod.GET,
    url: `${webhooksUrl({ auth })}.json`,
    headers: shopifyAuthHelpers.getAuthHeaders(auth),
    queryParams: { topic, address },
  });
  return response.body.webhooks.find(
    (webhook) => webhook.topic === topic && webhook.address === address
  );
}

async function deleteWebhook({
  auth,
  webhookId,
}: {
  auth: ShopifyAuth;
  webhookId: number;
}): Promise<void> {
  try {
    await httpClient.sendRequest({
      method: HttpMethod.DELETE,
      url: `${webhooksUrl({ auth })}/${webhookId}.json`,
      headers: shopifyAuthHelpers.getAuthHeaders(auth),
    });
  } catch (error) {
    if (!(error instanceof HttpError) || error.response.status !== 404) {
      throw error;
    }
  }
}

function webhooksUrl({ auth }: { auth: ShopifyAuth }): string {
  const shopName = shopifyAuthHelpers.getShopName(auth);
  return `https://${shopName}.myshopify.com/admin/api/${SHOPIFY_API_VERSION}/webhooks`;
}

const WEBHOOK_ID_KEY = 'shopify_webhook_id';

type ShopifyWebhook = {
  id: number;
  topic: string;
  address: string;
};
