import {
  createTrigger,
  MarkdownVariant,
  Property,
  tryCatch,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { postizAuth, postizAuthHelpers, PostizAuthValue } from '../common/auth';
import { postizApiCall } from '../common';

const WEBHOOK_ID_STORE_KEY = 'postiz_webhook_id';
const SAMPLE_LOOKBACK_DAYS = 30;
const SAMPLE_LIMIT = 5;

async function upsertWebhook({
  auth,
  webhookUrl,
  flowId,
  knownWebhookId,
}: {
  auth: PostizAuthValue;
  webhookUrl: string;
  flowId: string;
  knownWebhookId: string | undefined;
}): Promise<string> {
  const token = await postizAuthHelpers.login(auth);
  const { data: response, error } = await tryCatch(() =>
    httpClient.sendRequest<{ id: string }>({
      method: HttpMethod.POST,
      url: `${postizAuthHelpers.instanceApiUrl(auth)}/webhooks`,
      headers: { auth: token },
      body: {
        ...(knownWebhookId ? { id: knownWebhookId } : {}),
        name: `Activepieces (${flowId})`,
        url: webhookUrl,
        integrations: [],
      },
    })
  );
  if (error) {
    throw new Error(
      `Postiz refused to register the webhook for ${webhookUrl}. Postiz only accepts public HTTPS URLs, so an Activepieces instance that is not reachable from the internet has to use the API Key method and add the webhook by hand. (${error.message})`
    );
  }
  return response.body.id;
}

async function deleteWebhook({
  auth,
  webhookId,
}: {
  auth: PostizAuthValue;
  webhookId: string;
}): Promise<void> {
  const token = await postizAuthHelpers.login(auth);
  await httpClient.sendRequest({
    method: HttpMethod.DELETE,
    url: `${postizAuthHelpers.instanceApiUrl(auth)}/webhooks/${webhookId}`,
    headers: { auth: token },
  });
}

function toPublishedPost(post: PostizWebhookPost) {
  return {
    id: post.id,
    content: post.content,
    publish_date: post.publishDate,
    release_url: post.releaseURL ?? null,
    state: post.state,
    integration_id: post.integration?.id ?? null,
    integration_provider: post.integration?.providerIdentifier ?? null,
    integration_name: post.integration?.name ?? null,
  };
}

function isWebhookPost(post: unknown): post is PostizWebhookPost {
  return (
    typeof post === 'object' &&
    post !== null &&
    'id' in post &&
    typeof post.id === 'string'
  );
}

export const newPost = createTrigger({
  auth: postizAuth,
  name: 'new_post',
  displayName: 'New Published Post',
  description: 'Triggers when a post is published in Postiz',
  aiMetadata: {
    description:
      'Fires when a post transitions to the published state in Postiz, emitting the published post with its id, content, publish date, release URL, and the channel it went out on. Use to react to content going live (e.g. to log, notify, or fetch post analytics). Postiz calls this trigger over a webhook as soon as the post is live.',
  },
  props: {
    instructions: Property.MarkDown({
      value: `**Webhook URL**
\`\`\`text
{{webhookUrl}}
\`\`\`
- **API Key**: copy the URL above, then add it in Postiz under **Settings > Webhooks**. Postiz has no API to do this for you.
- **API Key + Email & Password**: nothing to do — the webhook is created in Postiz when this flow is published and removed when it is disabled.

Postiz only delivers to public HTTPS URLs, so this trigger needs an Activepieces instance reachable from the internet.`,
      variant: MarkdownVariant.INFO,
    }),
  },
  sampleData: {
    id: 'abc123',
    content: 'Hello world! Check out our latest update.',
    publish_date: '2024-12-15T10:00:00.000Z',
    release_url: 'https://x.com/user/status/123456',
    state: 'PUBLISHED',
    integration_id: 'int_123',
    integration_provider: 'x',
    integration_name: 'My X Account',
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    if (!postizAuthHelpers.isJwtAuth(context.auth)) {
      return;
    }
    const knownWebhookId = await context.store.get<string>(
      WEBHOOK_ID_STORE_KEY
    );
    const webhookId = await upsertWebhook({
      auth: context.auth,
      webhookUrl: context.webhookUrl,
      flowId: context.flows.current.id,
      knownWebhookId: knownWebhookId ?? undefined,
    });
    const { error } = await tryCatch(() =>
      context.store.put(WEBHOOK_ID_STORE_KEY, webhookId)
    );
    if (error) {
      await tryCatch(() => deleteWebhook({ auth: context.auth, webhookId }));
      throw error;
    }
  },
  async onDisable(context) {
    const webhookId = await context.store.get<string>(WEBHOOK_ID_STORE_KEY);
    if (!webhookId) {
      return;
    }
    if (postizAuthHelpers.isJwtAuth(context.auth)) {
      const { error } = await tryCatch(() =>
        deleteWebhook({ auth: context.auth, webhookId })
      );
      if (error) {
        return;
      }
    }
    await context.store.delete(WEBHOOK_ID_STORE_KEY);
  },
  async test(context) {
    const now = new Date();
    const lookbackStart = new Date(
      now.getTime() - SAMPLE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000
    );
    const response = await postizApiCall<{ posts: PostizWebhookPost[] }>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: '/posts',
      queryParams: {
        startDate: lookbackStart.toISOString(),
        endDate: now.toISOString(),
      },
    });
    return response.body.posts
      .filter((post) => post.state === 'PUBLISHED')
      .slice(0, SAMPLE_LIMIT)
      .map(toPublishedPost);
  },
  async run(context) {
    const body = context.payload.body;
    const posts = Array.isArray(body) ? body : [body];
    return posts
      .filter(isWebhookPost)
      .map(toPublishedPost);
  },
});

type PostizWebhookPost = {
  id: string;
  content: string;
  publishDate: string;
  releaseURL: string | null;
  state: string;
  integration: {
    id: string;
    providerIdentifier: string;
    name: string;
    picture: string;
  } | null;
};
