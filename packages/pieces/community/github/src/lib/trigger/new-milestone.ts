import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

interface WebhookInformation {
  webhookId: number;
  repo: string;
  owner: string;
}

export const newMilestoneTrigger = createTrigger({
  auth: githubAuth,
  name: 'new_milestone',
  displayName: 'New Milestone',
  description: 'Triggers when a new milestone is created.',
  props: {
    repository: githubCommon.repositoryDropdown,
  },
  sampleData: {
    action: 'created',
    milestone: {
      url: 'https://api.github.com/repos/octocat/Hello-World/milestones/1',
      html_url: 'https://github.com/octocat/Hello-World/milestones/v1.0',
      id: 1002604,
      number: 1,
      title: 'v1.0',
      description: 'Tracking milestone for version 1.0',
      creator: { login: 'octocat' },
      open_issues: 0,
      closed_issues: 0,
      state: 'open',
      created_at: '2011-04-10T20:09:31Z',
      updated_at: '2011-04-10T20:09:31Z',
      due_on: '2012-10-09T23:39:01Z',
      closed_at: null,
    },
    repository: { full_name: 'octocat/Hello-World' },
    sender: { login: 'octocat' },
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
        events: ['milestone'],
        config: {
          url: context.webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
        },
      },
    });

    await context.store.put<WebhookInformation>(
      'github_new_milestone_trigger',
      {
        webhookId: response.body.id,
        repo: repo,
        owner: owner,
      }
    );
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      'github_new_milestone_trigger'
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
    const payload = context.payload.body as { action?: string };

    if (payload.action === 'created') {
      return [context.payload.body];
    }

    return [];
  },
});
