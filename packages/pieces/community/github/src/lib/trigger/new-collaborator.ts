import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

interface WebhookInformation {
  webhookId: number;
  repo: string;
  owner: string;
}

export const newCollaboratorTrigger = createTrigger({
  auth: githubAuth,
  name: 'new_collaborator',
  displayName: 'New Collaborator',
  description: 'Triggers when a new collaborator is added to a repository.',
  props: {
    repository: githubCommon.repositoryDropdown,
  },
  sampleData: {
    action: 'added',
    member: {
      login: 'octocat',
      id: 1,
      node_id: 'MDQ6VXNlcjE=',
      avatar_url: 'https://github.com/images/error/octocat_happy.gif',
      gravatar_id: '',
      url: 'https://api.github.com/users/octocat',
      html_url: 'https://github.com/octocat',
      type: 'User',
      site_admin: false,
    },
    repository: {
      full_name: 'octocat/Hello-World',
    },
    sender: {
      login: 'admin-user',
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
        events: ['member'],
        config: {
          url: context.webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
        },
      },
    });

    await context.store.put<WebhookInformation>(
      'github_new_collaborator_trigger',
      {
        webhookId: response.body.id,
        repo: repo,
        owner: owner,
      }
    );
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      'github_new_collaborator_trigger'
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

    if (payload.action === 'added') {
      return [context.payload.body];
    }

    return [];
  },
});
