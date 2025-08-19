import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { githubAuth } from '../../';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubRegisterTrigger = ({
  name,
  displayName,
  description,
  sampleData,
}: {
  name: string;
  displayName: string;
  description: string;
  sampleData: object;
}) =>
  createTrigger({
    auth: githubAuth,
    name: `trigger_${name}`,
    displayName,
    description,
    props: {
      repository: githubCommon.repositoryDropdown,
    },
    sampleData,
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
          events: [name],
          config: {
            url: context.webhookUrl,
            content_type: 'json',
            insecure_ssl: '0',
          },
        },
      });

      await context.store.put<WebhookInformation>(`github_${name}_trigger`, {
        webhookId: response.body.id,
        owner: owner,
        repo: repo,
      });
    },
    async onDisable(context) {
      const response = await context.store.get<WebhookInformation>(
        `github_${name}_trigger`
      );
      if (response !== null && response !== undefined) {
        await githubApiCall({
          accessToken: context.auth.access_token,
          method: HttpMethod.DELETE,
          resourceUri: `/repos/${response.owner}/${response.repo}/hooks/${response.webhookId}`,
        });
      }
    },
    async run(context) {
      console.debug('payload received', context.payload.body);

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
  webhookId: number;
  repo: string;
  owner: string;
}
