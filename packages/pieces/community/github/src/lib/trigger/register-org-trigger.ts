import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { githubApiCall, githubCommon } from '../common';
import { githubAuth } from '../../';
import { HttpMethod } from '@activepieces/pieces-common';

export const githubRegisterOrgTrigger = ({
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
      organization: githubCommon.organizationDropdown,
    },
    sampleData,
    type: TriggerStrategy.WEBHOOK,
    async onEnable(context) {
      const { org } = context.propsValue.organization!;

      const response = await githubApiCall<{ id: number }>({
        accessToken: context.auth.access_token,
        method: HttpMethod.POST,
        resourceUri: `/orgs/${org}/hooks`,
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

      await context.store.put<OrgWebhookInformation>(`github_${name}_trigger`, {
        webhookId: response.body.id,
        org: org,
      });
    },
    async onDisable(context) {
      const response = await context.store.get<OrgWebhookInformation>(
        `github_${name}_trigger`
      );
      if (response !== null && response !== undefined) {
        await githubApiCall({
          accessToken: context.auth.access_token,
          method: HttpMethod.DELETE,
          resourceUri: `/orgs/${response.org}/hooks/${response.webhookId}`,
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

interface OrgWebhookInformation {
  webhookId: number;
  org: string;
}
