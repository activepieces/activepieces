import {
  createTrigger,
  TriggerStrategy,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubPaginatedApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

// Helper interface for storing webhook information
interface OrgWebhookInformation {
  webhookId: number;
  org: string;
}

// Dynamic dropdown to list organizations the user belongs to
const organizationDropdown = Property.Dropdown({
  displayName: 'Organization',
  required: true,
  refreshers: [],
  options: async ({ auth }) => {
    if (!auth) {
      return {
        disabled: true,
        options: [],
        placeholder: 'Please authenticate first',
      };
    }
    const response = await githubPaginatedApiCall<{ login: string }>({
      accessToken: (auth as OAuth2PropertyValue).access_token,
      method: HttpMethod.GET,
      resourceUri: '/user/orgs',
    });
    return {
      disabled: false,
      options: response.map((org) => {
        return {
          label: org.login,
          value: org.login,
        };
      }),
    };
  },
});

export const newRepositoryTrigger = createTrigger({
  auth: githubAuth,
  name: 'new_repository',
  displayName: 'New Repository',
  description: 'Fires when a new repository is created in an organization.',
  props: {
    organization: organizationDropdown,
  },
  sampleData: {
    "action": "created",
    "repository": {
      "id": 1296269,
      "name": "Hello-World-New",
      "full_name": "octocat/Hello-World-New",
      "owner": {
        "login": "octocat",
      }
    },
    "sender": {
      "login": "octocat",
    }
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const org = context.propsValue.organization!;

    // Create a webhook at the organization level
    const response = await githubApiCall<{ id: number }>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/orgs/${org}/hooks`,
      body: {
        name: 'web',
        active: true,
        events: ['repository'], // Subscribe to the 'repository' event
        config: {
          url: context.webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
        },
      },
    });

    await context.store.put<OrgWebhookInformation>('github_new_repository_trigger', {
      webhookId: response.body.id,
      org: org,
    });
  },
  async onDisable(context) {
    const webhook = await context.store.get<OrgWebhookInformation>(
      'github_new_repository_trigger'
    );
    if (webhook) {
      // Delete the organization-level webhook
      await githubApiCall({
        accessToken: context.auth.access_token,
        method: HttpMethod.DELETE,
        resourceUri: `/orgs/${webhook.org}/hooks/${webhook.webhookId}`,
      });
    }
  },
  async run(context) {
    const payload = context.payload.body as { action?: string };

    // The 'repository' event fires for many actions.
    // We only want to trigger when a repository is "created".
    if (payload.action === 'created') {
      return [context.payload.body];
    }

    return [];
  },
});