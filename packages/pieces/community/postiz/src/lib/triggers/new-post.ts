import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { MarkdownVariant } from '@activepieces/shared';
import {
  postizAuth,
  PostizAuthValue,
  PostizJwtAuthValue,
  isApiKeyAuthentication,
  getJwtToken,
} from '../common/auth';
import { postizApiCall, postizCommon } from '../common';

const WEBHOOK_STORE_KEY = 'postiz_webhook_id';
const SAMPLE_POSTS_LOOKBACK_DAYS = 30;
const SAMPLE_POSTS_LIMIT = 5;

function buildApiRoot(auth: PostizJwtAuthValue): string {
  return auth.props.base_url.trim().replace(/\/+$/, '');
}

function toTriggerItem(post: PostizWebhookPost) {
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

export const newPost = createTrigger({
  auth: postizAuth,
  name: 'new_post',
  displayName: 'New Published Post',
  description: 'Triggers when a post is published in Postiz',
  props: {
    instructions: Property.MarkDown({
      value: `**Webhook URL:**
\`\`\`text
{{webhookUrl}}
\`\`\`
If you are using **API Key** authentication, copy this URL and paste it in your Postiz dashboard under **Settings > Webhooks**.

With **Email & Password (JWT)** authentication, the webhook is registered automatically.`,
      variant: MarkdownVariant.INFO,
    }),
    integrations: postizCommon.integrationMultiSelect,
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
    const auth = context.auth as PostizAuthValue;
    if (isApiKeyAuthentication(auth)) {
      return;
    }
    const jwtAuth = auth as PostizJwtAuthValue;
    const apiRoot = buildApiRoot(jwtAuth);
    const jwt = await getJwtToken({
      baseUrl: jwtAuth.props.base_url,
      email: jwtAuth.props.email,
      password: jwtAuth.props.password,
    });
    const selectedIntegrations =
      (context.propsValue.integrations as string[] | undefined) ?? [];
    const response = await httpClient.sendRequest<{ id: string }>({
      method: HttpMethod.POST,
      url: `${apiRoot}/api/webhooks`,
      headers: {
        auth: jwt,
        'Content-Type': 'application/json',
      },
      body: {
        name: `Activepieces – ${Date.now()}`,
        url: context.webhookUrl,
        integrations: selectedIntegrations,
      },
    });
    await context.store.put(WEBHOOK_STORE_KEY, response.body.id);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>(WEBHOOK_STORE_KEY);
    if (!webhookId) {
      return;
    }
    const auth = context.auth as PostizAuthValue;
    if (!isApiKeyAuthentication(auth)) {
      const jwtAuth = auth as PostizJwtAuthValue;
      const apiRoot = buildApiRoot(jwtAuth);
      try {
        const jwt = await getJwtToken({
          baseUrl: jwtAuth.props.base_url,
          email: jwtAuth.props.email,
          password: jwtAuth.props.password,
        });
        await httpClient.sendRequest({
          method: HttpMethod.DELETE,
          url: `${apiRoot}/api/webhooks/${webhookId}`,
          headers: { auth: jwt },
        });
      } catch {
        // Webhook may have been manually deleted or credentials changed — ignore
      }
    }
    await context.store.delete(WEBHOOK_STORE_KEY);
  },

  async test(context) {
    const now = new Date();
    const lookbackStart = new Date(
      now.getTime() - SAMPLE_POSTS_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    );
    const response = await postizApiCall<{ posts: PostizWebhookPost[] }>({
      auth: context.auth as PostizAuthValue,
      method: HttpMethod.GET,
      path: '/posts',
      queryParams: {
        startDate: lookbackStart.toISOString(),
        endDate: now.toISOString(),
      },
    });
    const selectedIntegrations =
      (context.propsValue.integrations as string[] | undefined) ?? [];
    return response.body.posts
      .filter((post) => post.state === 'PUBLISHED')
      .filter(
        (post) =>
          selectedIntegrations.length === 0 ||
          (post.integration?.id !== undefined &&
            selectedIntegrations.includes(post.integration.id)),
      )
      .slice(0, SAMPLE_POSTS_LIMIT)
      .map(toTriggerItem);
  },

  async run(context) {
    const body = context.payload.body as PostizWebhookPost | PostizWebhookPost[];
    const posts = Array.isArray(body) ? body : [body];
    const selectedIntegrations =
      (context.propsValue.integrations as string[] | undefined) ?? [];

    return posts
      .filter((post) => post.state === 'PUBLISHED')
      .filter(
        (post) =>
          selectedIntegrations.length === 0 ||
          (post.integration?.id !== undefined &&
            selectedIntegrations.includes(post.integration.id)),
      )
      .map(toTriggerItem);
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
