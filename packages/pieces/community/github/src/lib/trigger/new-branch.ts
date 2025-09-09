import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubCommon } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

// A helper interface for what we store about the webhook
interface WebhookInformation {
  webhookId: number;
  repo: string;
  owner: string;
}

export const newBranchTrigger = createTrigger({
  auth: githubAuth,
  name: 'new_branch',
  displayName: 'New Branch',
  description: 'Fires when a new branch is created.',
  props: {
    repository: githubCommon.repositoryDropdown,
  },
  sampleData: {
    "ref": "feature/new-design",
    "ref_type": "branch",
    "master_branch": "main",
    "description": "A repository for testing",
    "pusher_type": "user",
    "repository": {
      "full_name": "activepieces/activepieces",
      // ... other repository data
    },
    "sender": {
      "login": "Logan",
      // ... other sender data
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { repo, owner } = context.propsValue.repository!;

    // This API call creates the webhook on the selected repository
    const response = await githubApiCall<{ id: number }>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/repos/${owner}/${repo}/hooks`,
      body: {
        name: 'web',
        active: true,
        events: ['create'], // Subscribe to the 'create' event for branches and tags
        config: {
          url: context.webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
        },
      },
    });

    // Store the webhook ID to be able to disable it later
    await context.store.put<WebhookInformation>('github_new_branch_trigger', {
      webhookId: response.body.id,
      repo: repo,
      owner: owner,
    });
  },
  async onDisable(context) {
    const webhook = await context.store.get<WebhookInformation>(
      'github_new_branch_trigger'
    );
    if (webhook !== null && webhook !== undefined) {
      // This API call deletes the webhook
      await githubApiCall({
        accessToken: context.auth.access_token,
        method: HttpMethod.DELETE,
        resourceUri: `/repos/${webhook.owner}/${webhook.repo}/hooks/${webhook.webhookId}`,
      });
    }
  },
  async run(context) {
    const payloadBody = context.payload.body as { ref_type?: string };

    // The 'create' event fires for new branches AND new tags.
    // We must filter the webhook events to only return the ones for branches.
    if (payloadBody.ref_type === 'branch') {
      return [context.payload.body];
    }

    return [];
  },
});