import {
  createTrigger,
  TriggerStrategy,
  Property,
  OAuth2PropertyValue,
} from '@activepieces/pieces-framework';
import { githubAuth } from '../../index';
import { githubApiCall, githubPaginatedApiCall } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

interface OrgWebhookInformation {
  webhookId: number;
  org: string;
}

// Dropdown to select organization
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
      options: response.map((org) => ({
        label: org.login,
        value: org.login,
      })),
    };
  },
});

export const githubNewRepositoryTrigger = createTrigger({
  auth: githubAuth,
  name: 'new_repository',
  displayName: 'New Repository',
  description:
    'Fires when a new repository is created in the selected organization.',
  props: {
    organization: organizationDropdown,
  },
  sampleData: {
    action: 'created',
    repository: {
      id: 1296269,
      node_id: 'MDEwOlJlcG9zaXRvcnkxMjk2MjY5',
      name: 'awesome-project',
      full_name: 'octocat/awesome-project',
      private: false,
      owner: {
        login: 'octocat',
        id: 1,
        node_id: 'MDQ6VXNlcjE=',
        avatar_url: 'https://github.com/images/error/octocat_happy.gif',
        html_url: 'https://github.com/octocat',
        type: 'User',
        site_admin: false,
      },
      html_url: 'https://github.com/octocat/awesome-project',
      description: 'An awesome new project repository.',
      fork: false,
      url: 'https://api.github.com/repos/octocat/awesome-project',
      created_at: '2023-09-01T10:00:00Z',
      updated_at: '2023-09-01T10:00:00Z',
      pushed_at: '2023-09-01T10:00:00Z',
      homepage: 'https://awesome-project.example.com',
      visibility: 'public',
      topics: ['open-source', 'example', 'demo'],
      archived: false,
      disabled: false,
    },
    organization: {
      login: 'octo-org',
      id: 2,
      url: 'https://api.github.com/orgs/octo-org',
      html_url: 'https://github.com/octo-org',
    },
    sender: {
      login: 'octocat',
      id: 1,
      avatar_url: 'https://github.com/images/error/octocat_happy.gif',
      html_url: 'https://github.com/octocat',
      type: 'User',
    },
  },
  type: TriggerStrategy.WEBHOOK,

  async onEnable(context) {
    const org = context.propsValue.organization!;

    // Create an org-wide webhook for repository events
    const response = await githubApiCall<{ id: number }>({
      accessToken: context.auth.access_token,
      method: HttpMethod.POST,
      resourceUri: `/orgs/${org}/hooks`,
      body: {
        name: 'web',
        active: true,
        events: ['repository'],
        config: {
          url: context.webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
        },
      },
    });

    await context.store.put<OrgWebhookInformation>(
      'github_new_repository_trigger',
      {
        webhookId: response.body.id,
        org,
      }
    );
  },

  async onDisable(context) {
    const webhook = await context.store.get<OrgWebhookInformation>(
      'github_new_repository_trigger'
    );

    if (webhook) {
      await githubApiCall({
        accessToken: context.auth.access_token,
        method: HttpMethod.DELETE,
        resourceUri: `/orgs/${webhook.org}/hooks/${webhook.webhookId}`,
      });
    }
  },

  async run(context) {
    const payload = context.payload.body as { action?: string };

    // Only fire on "created" repositories
    if (payload.action === 'created') {
      return [context.payload.body];
    }

    return [];
  },
});
