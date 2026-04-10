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

const WEBHOOK_STORE_KEY = 'postiz_webhook_id';

function buildApiRoot(auth: PostizJwtAuthValue): string {
  return auth.props.base_url.trim().replace(/\/+$/, '');
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
        integrations: [],
      },
    });
    await context.store.put(WEBHOOK_STORE_KEY, response.body.id);
  },

  async onDisable(context) {
    const webhookId = await context.store.get<string>(WEBHOOK_STORE_KEY);
    if (!webhookId) {
      return;
    }
    const auth = context.auth as PostizJwtAuthValue;
    const apiRoot = buildApiRoot(auth);
    const jwt = await getJwtToken({
      baseUrl: auth.props.base_url,
      email: auth.props.email,
      password: auth.props.password,
    });
    try {
      await httpClient.sendRequest({
        method: HttpMethod.DELETE,
        url: `${apiRoot}/api/webhooks/${webhookId}`,
        headers: { auth: jwt },
      });
    } catch {
      // Webhook may have been manually deleted — ignore
    }
    await context.store.delete(WEBHOOK_STORE_KEY);
  },

  async run(context) {
    const body = context.payload.body as PostizWebhookPost | PostizWebhookPost[];
    const posts = Array.isArray(body) ? body : [body];

    return posts.map((post) => ({
      id: post.id,
      content: post.content,
      publish_date: post.publishDate,
      release_url: post.releaseURL ?? null,
      state: post.state,
      integration_id: post.integration?.id ?? null,
      integration_provider: post.integration?.providerIdentifier ?? null,
      integration_name: post.integration?.name ?? null,
    }));
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
