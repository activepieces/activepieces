import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth, PostHogAuth } from '../..';

export const posthogCreateProject = createAction({
  auth: posthogAuth,
  name: 'create_project',
  displayName: 'Create Project',
  description: 'Create a new PostHog project in your organization',
  audience: 'both',
  aiMetadata: { description: 'Creates a new project within a chosen PostHog organization, optionally anonymizing incoming IP addresses. Use when provisioning a fresh analytics project. Not idempotent: each call creates a separate project even with the same name.', idempotent: false },
  props: {
    organization_id: Property.Dropdown({
      displayName: 'Organization',
      description: 'The organization to create the project in',
      required: true,
      refreshers: [],
      auth: posthogAuth,
      options: async ({ auth }) => {
        if (!auth) {
          return { disabled: true, options: [], placeholder: 'Connect your account first' };
        }
        const { personal_api_key, api_host } = (auth as unknown as { props: PostHogAuth }).props;
        const apiBase = api_host || 'https://us.posthog.com';
        try {
          const result = await httpClient.sendRequest<OrganizationsResponse>({
            method: HttpMethod.GET,
            url: `${apiBase}/api/organizations/`,
            authentication: {
              type: AuthenticationType.BEARER_TOKEN,
              token: personal_api_key,
            },
          });
          return {
            disabled: false,
            options: (result.body.results ?? []).map((org) => ({
              label: org.name,
              value: org.id,
            })),
          };
        } catch {
          return { disabled: true, options: [], placeholder: 'Failed to load organizations. Check your connection.' };
        }
      },
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
    const { personal_api_key, api_host } = context.auth.props;
    const apiBase = api_host || 'https://us.posthog.com';
    const { organization_id, name, anonymize_ips } = context.propsValue;

    const result = await httpClient.sendRequest<CreateProjectResponse>({
      method: HttpMethod.POST,
      url: `${apiBase}/api/organizations/${organization_id}/projects/`,
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

type OrganizationsResponse = {
  results: { id: string; name: string }[];
};

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
