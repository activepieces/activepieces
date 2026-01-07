import { createTrigger, TriggerStrategy, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { giteaAuth } from '../auth';
import { giteaApiCall, giteaCommon } from '../common';

interface WebhookInformation {
  webhookId: number;
  repo: string;
  owner: string;
}

export const newIssue = createTrigger({
  auth: giteaAuth,
  name: 'new_issue',
  displayName: 'New Issue',
  description: 'Triggers when a new issue is created.',
  props: {
    repository: giteaCommon.repositoryDropdown,
  },
  sampleData: {
    action: 'opened',
    issue: {
      id: 1,
      url: 'https://gitea.com/api/v1/repos/owner/repo/issues/1',
      number: 1,
      user: {
        id: 1,
        username: 'user',
      },
      title: 'Issue Title',
      body: 'Issue Body',
      state: 'open',
    },
    repository: {
      id: 1,
      name: 'repo',
      owner: {
        login: 'owner',
      },
      full_name: 'owner/repo',
    },
    sender: {
      id: 1,
      username: 'user',
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
        events: ['issues'],
        config: {
          url: context.webhookUrl,
          content_type: 'json',
        },
      },
    });

    await context.store.put<WebhookInformation>('gitea_new_issue_trigger', {
      webhookId: response.body.id,
      repo: repo,
      owner: owner,
    });
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      'gitea_new_issue_trigger'
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
    const payloadBody = context.payload.body as { action: string };
    if (payloadBody.action === 'opened') {
      return [context.payload.body];
    }
    return [];
  },
});
