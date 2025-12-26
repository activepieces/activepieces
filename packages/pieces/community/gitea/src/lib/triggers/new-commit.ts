import { createTrigger, TriggerStrategy, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { giteaAuth } from '../auth';
import { giteaApiCall, giteaCommon } from '../common';

interface WebhookInformation {
  webhookId: number;
  repo: string;
  owner: string;
}

export const newCommit = createTrigger({
  auth: giteaAuth,
  name: 'new_commit',
  displayName: 'New Commit',
  description: 'Triggers when a new commit is pushed to a repository.',
  props: {
    repository: giteaCommon.repositoryDropdown,
    branch: giteaCommon.branchDropdown,
  },
  sampleData: {
    ref: 'refs/heads/main',
    before: '5a4d...3c2f',
    after: '1b2c...9d8e',
    compare_url: 'https://gitea.com/owner/repo/compare/5a4d...1b2c',
    commits: [
      {
        id: '1b2c...9d8e',
        message: 'Add new feature',
        url: 'https://gitea.com/owner/repo/commit/1b2c...9d8e',
        author: {
          name: 'Author Name',
          email: 'author@test.com',
          username: 'author',
        },
        committer: {
          name: 'Committer Name',
          email: 'committer@test.com',
          username: 'committer',
        },
        timestamp: '2023-01-01T00:00:00Z',
      },
    ],
    repository: {
      name: 'repo',
      full_name: 'owner/repo',
      owner: {
        login: 'owner',
      },
    },
    pusher: {
      login: 'pusher',
    },
    sender: {
      login: 'sender',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { repo, owner } = context.propsValue.repository!;

    const response = await giteaApiCall<{ id: number }>({
      auth: context.auth as OAuth2PropertyValue,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/hooks`,
      body: {
        type: 'gitea',
        active: true,
        events: ['push'],
        config: {
          url: context.webhookUrl,
          content_type: 'json',
        },
      },
    });

    await context.store.put<WebhookInformation>('gitea_new_commit_trigger', {
      webhookId: response.body.id,
      repo: repo,
      owner: owner,
    });
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      'gitea_new_commit_trigger'
    );

    if (webhook) {
      await giteaApiCall({
        auth: context.auth as OAuth2PropertyValue,
        method: HttpMethod.DELETE,
        resourceUri: `/repos/${webhook.owner}/${webhook.repo}/hooks/${webhook.webhookId}`,
      });
    }
  },
  async run(context) {
    const payloadBody = context.payload.body as { ref?: string };
    const branch = context.propsValue.branch;

    if (branch && payloadBody.ref !== `refs/heads/${branch}`) {
      return [];
    }

    return [context.payload.body];
  },
});
