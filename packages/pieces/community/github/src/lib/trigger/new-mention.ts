import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

interface WebhookInformation {
  webhookId: number;
  repo: string;
  owner: string;
}

interface GitHubUserResponse {
  login: string;
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

    await context.store.put<WebhookInformation>(
      'github_new_mention_trigger',
      { webhookId: response.body.id, repo, owner }
    );
  },

  async onDisable(context) {
    const webhook =
      await context.store.get<WebhookInformation>(
        'github_new_mention_trigger'
      );

    if (webhook !== null && webhook !== undefined) {
      await githubApiCall({
        accessToken: context.auth.access_token,
        method: HttpMethod.DELETE,
        resourceUri: `/repos/${webhook.owner}/${webhook.repo}/hooks/${webhook.webhookId}`,
      });
    }
  },

  async run(context) {
    const body = context.payload.body as any;
    const comment = body.comment?.body ?? '';

    const userResponse = await githubApiCall<GitHubUserResponse>({
      accessToken: context.auth.access_token,
      method: HttpMethod.GET,
      resourceUri: '/user',
    });

    const username = userResponse.body.login;

    if (comment.includes(`@${username}`)) {
      return [body];
    }

    return [];
  },
});
