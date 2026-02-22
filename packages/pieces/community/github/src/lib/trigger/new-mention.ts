import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { githubAuth } from '../auth';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

interface WebhookInformation {
  webhookId: number;
  repo: string;
  owner: string;
  username: string;
}

interface GitHubUserResponse {
  login: string;
}

interface MentionPayload {
  action?: string;
  comment?: {
    body?: string;
  };
}

const STORE_KEY = 'github_new_mention_trigger';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function containsMention(comment: string, username: string): boolean {
  const pattern = new RegExp(
    `(^|[^A-Za-z0-9-])@${escapeRegExp(username)}(?![A-Za-z0-9-])`,
    'i'
  );
  return pattern.test(comment);
}

export const newMentionTrigger = createTrigger({
  auth: githubAuth,
  name: 'new_mention',
  displayName: 'New Mention',
  description: 'Triggers when you are mentioned in a comment.',

  props: {
    repository: githubCommon.repositoryDropdown,
  },

  type: TriggerStrategy.WEBHOOK,

  sampleData: {
    action: 'created',
    comment: {
      body: '@octocat Please review this.',
      user: { login: 'octocat' },
      created_at: '2026-02-15T20:09:31Z',
    },
    repository: { full_name: 'octocat/Hello-World' },
    sender: { login: 'octocat' },
  },

  async onEnable(context) {
    const { repo, owner } = context.propsValue.repository!;
    const userResponse = await githubApiCall<GitHubUserResponse>({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      resourceUri: '/user',
    });

    const response = await githubApiCall<{ id: number }>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/hooks`,
      body: {
        name: 'web',
        active: true,
        events: ['issue_comment', 'pull_request_review_comment'],
        config: {
          url: context.webhookUrl,
          content_type: 'json',
        },
      },
    });

    await context.store.put<WebhookInformation>(STORE_KEY, {
      webhookId: response.body.id,
      repo,
      owner,
      username: userResponse.body.login,
    });
  },

  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(STORE_KEY);

    if (webhook !== null && webhook !== undefined) {
      await githubApiCall({
        accessToken: context.auth.access_token,
        method: HttpMethod.DELETE,
        resourceUri: `/repos/${webhook.owner}/${webhook.repo}/hooks/${webhook.webhookId}`,
      });
    }
  },

  async run(context) {
    const body = context.payload.body as MentionPayload;
    if (body.action !== 'created' && body.action !== 'edited') {
      return [];
    }

    const comment = body.comment?.body ?? '';
    if (!comment) {
      return [];
    }

    const webhook = await context.store.get<WebhookInformation>(STORE_KEY);
    let username = webhook?.username;
    if (!username) {
      const userResponse = await githubApiCall<GitHubUserResponse>({
        accessToken: context.auth.access_token,
        method: HttpMethod.GET,
        resourceUri: '/user',
      });
      username = userResponse.body.login;
    }

    if (username && containsMention(comment, username)) {
      return [context.payload.body];
    }

    return [];
  },
});
