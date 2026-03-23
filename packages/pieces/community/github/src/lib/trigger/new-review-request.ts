import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { githubAuth } from '../auth';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

interface WebhookInformation {
  webhookId: number;
  repo: string;
  owner: string;
}

export const newReviewRequestTrigger = createTrigger({
  auth: githubAuth,
  name: 'new_review_request',
  displayName: 'New Review Request',
  description: 'Triggers when you are requested to review a pull request.',

  props: {
    repository: githubCommon.repositoryDropdown,
  },

  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const { repo, owner } = context.propsValue.repository!;

    const response = await githubApiCall<{ id: number }>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/hooks`,
      body: {
        name: 'web',
        active: true,
        events: ['pull_request'],
        config: {
          url: context.webhookUrl,
          content_type: 'json',
        },
      },
    });

    await context.store.put<WebhookInformation>(
      'github_new_review_request_trigger',
      { webhookId: response.body.id, repo, owner }
    );
  },

  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      'github_new_review_request_trigger'
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

    if (body.action === 'review_requested') {
      return [body];
    }

    return [];
  },

  sampleData: {
    action: 'review_requested',
    pull_request: {
      url: 'https://api.github.com/repos/octocat/Hello-World/pulls/1347',
      id: 1,
      number: 1347,
      title: 'Amazing new feature',
      user: { login: 'octocat' },
      state: 'open',
      created_at: '2026-02-15T20:09:31Z',
      updated_at: '2026-02-15T20:09:31Z',
    },
    repository: { full_name: 'octocat/Hello-World' },
    sender: { login: 'octocat' },
  },
});
