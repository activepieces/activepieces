import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { githubCommon } from '../common';
import { githubAuth } from '../../';
import { Octokit } from 'octokit';

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
      const client = new Octokit({ auth: context.auth.access_token });
      const response = await client.rest.repos.createWebhook({
        owner,
        repo,
        active: true,
        events: [name],
        config: {
          url: context.webhookUrl,
          content_type: 'json',
          insecure_ssl: '0',
        },
      });

      await context.store.put<WebhookInformation>(`github_${name}_trigger`, {
        webhookId: response.data.id,
        owner: owner,
        repo: repo,
      });
    },
    async onDisable(context) {
      const response = await context.store.get<WebhookInformation>(
        `github_${name}_trigger`
      );
      if (response !== null && response !== undefined) {
        const client = new Octokit({ auth: context.auth.access_token });
        await client.rest.repos.deleteWebhook({
          owner: response.owner,
          repo: response.repo,
          hook_id: response.webhookId,
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
