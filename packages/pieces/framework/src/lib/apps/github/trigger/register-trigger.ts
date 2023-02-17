import {
  createTrigger,
  TriggerStrategy,
} from '../../../framework/trigger/trigger';
import { httpClient } from '../../../common/http/core/http-client';
import { HttpRequest } from '../../../common/http/core/http-request';
import { HttpMethod } from '../../../common/http/core/http-method';
import { AuthenticationType } from '../../../common/authentication/core/authentication-type';
import { githubCommon } from '../common';

export const registerTrigger = ({
  name,
  displayName,
  description,
  sampleData
}: {
  name: string,
  displayName: string,
  description: string,
  sampleData: Object
}) => createTrigger({
  name,
  displayName,
  description,
  props: {
    authentication: githubCommon.authentication,
    repository: githubCommon.repositoryDropdown
  },
  sampleData,
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
        token: context.propsValue['authentication']!['access_token'],
      },
      queryParams: {},
    };
    const { body: webhook } = await httpClient.sendRequest<{ id: string }>(request);
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
          token: context.propsValue['authentication']!['access_token'],
        },
      };
      await httpClient.sendRequest(request);
    }
  },
  async run(context) {
    if (isVerficationCall(context.payload.body)) {
      return [];
    }
    return [context.payload.body];
  },
});

function isVerficationCall(payload: Record<string, any>) {
  return payload['zen'] !== undefined;
}

interface WebhookInformation {
  webhookId: string;
  repo: string;
  owner: string;
}
