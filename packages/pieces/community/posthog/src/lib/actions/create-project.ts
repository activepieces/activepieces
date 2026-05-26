import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../..';

export const posthogCreateProject = createAction({
  auth: posthogAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new PostHog project in your organization',
  props: {
    organization_id: Property.ShortText({
      displayName: 'Organization ID',
      description:
        'Your PostHog organization ID. Found in the URL when viewing organization settings: `/organization/{id}/settings`',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Project Name',
      description: 'The name of the new project',
      required: true,
    }),
    anonymize_ips: Property.Checkbox({
      displayName: 'Anonymize IPs',
      description: 'Whether to anonymize incoming IP addresses',
      required: false,
    }),
  },
  async run(context) {
    const { personal_api_key, host } = context.auth.props;
    const baseUrl = host || 'https://app.posthog.com';
    const { organization_id, name, anonymize_ips } = context.propsValue;

    const result = await httpClient.sendRequest<CreateProjectResponse>({
      method: HttpMethod.POST,
      url: `${baseUrl}/api/organizations/${organization_id}/projects/`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: personal_api_key,
      },
      body: { name, anonymize_ips },
    });

    const p = result.body;
    return {
      id: p.id,
      uuid: p.uuid,
      name: p.name,
      api_token: p.api_token,
      organization: p.organization,
      timezone: p.timezone ?? null,
      anonymize_ips: p.anonymize_ips ?? false,
      created_at: p.created_at,
      updated_at: p.updated_at,
    };
  },
});

type CreateProjectResponse = {
  id: number;
  uuid: string;
  name: string;
  api_token: string;
  organization: string;
  timezone: string;
  anonymize_ips: boolean;
  created_at: string;
  updated_at: string;
};
