import { createTrigger, TriggerStrategy, OAuth2PropertyValue } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { giteaAuth } from '../auth';
import { giteaApiCall, giteaCommon } from '../common';

interface WebhookInformation {
  webhookId: number;
  repo: string;
  owner: string;
}

export const workflowRunCompleted = createTrigger({
  auth: giteaAuth,
  name: 'workflow_run_completed',
  displayName: 'Workflow Run Completed',
  description: 'Triggers when a workflow run is completed.',
  props: {
    repository: giteaCommon.repositoryDropdown,
  },
  sampleData: {
    action: 'completed',
    workflow_run: {
      id: 1,
      name: 'CI',
      head_branch: 'main',
      head_sha: 'sha',
      status: 'completed',
      conclusion: 'success',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:01:00Z',
    },
    repository: {
      name: 'repo',
      owner: {
        login: 'owner',
      },
      full_name: 'owner/repo',
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
        events: ['workflow_run'],
        config: {
          url: context.webhookUrl,
          content_type: 'json',
        },
      },
    });

    await context.store.put<WebhookInformation>('gitea_workflow_run_trigger', {
      webhookId: response.body.id,
      repo: repo,
      owner: owner,
    });
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      'gitea_workflow_run_trigger'
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
    if (payloadBody.action === 'completed') {
      return [context.payload.body];
    }
    return [];
  },
});
