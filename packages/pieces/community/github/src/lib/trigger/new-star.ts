import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpRequest,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { githubCommon } from '../common';
import { githubAuth } from '../../';

export const githubNewRepoEvent = createTrigger({
  auth: githubAuth,
  name: 'new_star',
  displayName: 'New Star',
  description: 'Triggers when there is a new star on the repository',
  props: {
    repository: githubCommon.repositoryDropdown,
  },
  sampleData: {
    action: 'created',
    starred_at: '2023-01-23T13:23:24Z',
    repository: {
      id: 573661753,
      name: 'activepieces',
      full_name: 'activepieces/activepieces',
      owner: {
        login: 'activepieces',
        id: 99494700,
      },
      topics: ['automation', 'low-code', 'no-code', 'workflows', 'zapier'],
      visibility: 'public',
      forks: 10,
      open_issues: 49,
      watchers: 155,
      default_branch: 'main',
    },
    organization: {
      login: 'activepieces',
      id: 99494700,
      description:
        'Automate your work, Open source alternative to Zapier, Tray.io, make',
    },
    sender: {
      login: 'abuaboud',
      id: 1812998,
      avatar_url: 'https://avatars.githubusercontent.com/u/31868364?v=4',
    },
  },
  type: TriggerStrategy.WEBHOOK,
  async onEnable(context) {
    const { repo, owner } = context.propsValue['repository']!;
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${githubCommon.baseUrl}/repos/${owner}/${repo}/hooks`,
      body: {
        owner: owner,
        repo: repo,
        active: true,
        events: ['star'],
        config: {
          url: context.webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
        },
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      queryParams: {},
    };
    const { body: webhook } = await httpClient.sendRequest<{ id: string }>(
      request
    );
    await context.store.put<WebhookInformation>('_trigger', {
      webhookId: webhook.id,
      owner: owner,
      repo: repo,
    });
  },
  async onDisable(context) {
    const response = await context.store.get<WebhookInformation>('_trigger');
    if (response !== null && response !== undefined) {
      const request: HttpRequest = {
        method: HttpMethod.DELETE,
        url: `${githubCommon.baseUrl}/repos/${response.owner}/${response.repo}/hooks/${response.webhookId}`,
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: context.auth.access_token,
        },
      };
      await httpClient.sendRequest(request);
    }
  },
  async run(context) {
    if (isVerificationCall(context.payload.body as Record<string, unknown>)) {
      return [];
    }
    return [context.payload.body];
  },
});

function isVerificationCall(payload: Record<string, any>) {
  return payload['zen'] !== undefined;
}

interface WebhookInformation {
  webhookId: string;
  repo: string;
  owner: string;
}
