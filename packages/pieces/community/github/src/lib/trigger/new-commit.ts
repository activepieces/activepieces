import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { githubAuth } from '../auth';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

interface WebhookInformation {
  webhookId: number;
  repo: string;
  owner: string;
}

interface PushCommit {
  distinct?: boolean;
}

interface PushPayload {
  deleted?: boolean;
  ref?: string;
  commits?: PushCommit[];
}

export const newCommitTrigger = createTrigger({
  auth: githubAuth,
  name: 'new_commit',
  displayName: 'New Commit',
  description: 'Triggers when a new commit is pushed.',
  props: {
    repository: githubCommon.repositoryDropdown,
  },

  sampleData: {
    ref: 'refs/heads/main',
    commits: [
      {
        id: 'def456',
        message: 'Add new feature',
        timestamp: '2026-02-15T12:34:56Z',
        url: 'https://github.com/activepieces/activepieces/commit/def456',
      },
    ],
    repository: {
      full_name: 'activepieces/activepieces',
    },
    sender: {
      login: 'Logan',
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
        events: ['push'],
        config: {
          url: context.webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
        },
      },
    });

    await context.store.put<WebhookInformation>('github_new_commit_trigger', {
      webhookId: response.body.id,
      repo,
      owner,
    });
  },

  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      'github_new_commit_trigger'
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
    const body = context.payload.body as PushPayload;
    if (body.deleted || !body.ref?.startsWith('refs/heads/')) {
      return [];
    }

    const commits = body.commits ?? [];
    // distinct is GitHub’s signal for whether commit is new in push history.
    return commits.filter((commit) => commit.distinct === true);
  },
});
