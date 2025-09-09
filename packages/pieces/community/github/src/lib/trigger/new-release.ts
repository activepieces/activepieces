import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

interface WebhookInformation {
  webhookId: number;
  repo: string;
  owner: string;
}

export const newReleaseTrigger = createTrigger({
  auth: githubAuth,
  name: 'new_release',
  displayName: 'New Release',
  description: 'Triggers when a new release is added.',
  props: {
    repository: githubCommon.repositoryDropdown,
  },
  sampleData: {
    action: 'published',
    release: {
      url: 'https://api.github.com/repos/octocat/Hello-World/releases/1',
      html_url: 'https://github.com/octocat/Hello-World/releases/v1.0.0',
      id: 1,
      tag_name: 'v1.0.0',
      target_commitish: 'master',
      name: 'v1.0.0',
      body: 'Description of the release',
      draft: false,
      prerelease: false,
      author: { login: 'octocat' },
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
        events: ['release'],
        config: {
          url: context.webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
        },
      },
    });

    await context.store.put<WebhookInformation>('github_new_release_trigger', {
      webhookId: response.body.id,
      repo: repo,
      owner: owner,
    });
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      'github_new_release_trigger'
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
