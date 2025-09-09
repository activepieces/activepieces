import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

interface WebhookInformation {
  webhookId: number;
  repo: string;
  owner: string;
}

export const newLabelTrigger = createTrigger({
  auth: githubAuth,
  name: 'new_label',
  displayName: 'New Label',
  description: 'Triggers when a new label is created in a repository.',
  props: {
    repository: githubCommon.repositoryDropdown,
  },
  sampleData: {
    action: 'created',
    label: {
      id: 4858888116,
      node_id: 'LA_kwDOAnG2fM7ma3_Q',
      url: 'https://api.github.com/repos/octocat/Hello-World/labels/new-label',
      name: 'new-label',
      color: 'f29513',
      default: false,
      description: 'A new label for issues',
    },
    repository: {
      full_name: 'octocat/Hello-World',
    },
    sender: {
      login: 'octocat',
    },
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
        events: ['label'],
        config: {
          url: context.webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
        },
      },
    });

    await context.store.put<WebhookInformation>('github_new_label_trigger', {
      webhookId: response.body.id,
      repo: repo,
      owner: owner,
    });
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      'github_new_label_trigger'
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
