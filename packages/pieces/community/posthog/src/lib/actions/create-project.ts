import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { posthogAuth } from '../auth';
import { posthogClient } from '../common/client';
import { posthogOutputSchemas } from '../common/output-schemas';

export const posthogCreateProject = createAction({
  auth: posthogAuth,
  name: 'create_project',
  classification: 'WRITE',
  displayName: 'Create Project',
  description: 'Create a new PostHog project in your organization',
  audience: 'human',
  outputSchema: posthogOutputSchemas.project,
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
        try {
          const body = await posthogClient.request({ auth: auth.props, method: HttpMethod.GET, path: '/api/organizations/' });
          return {
            disabled: false,
            options: posthogClient.arrayOf(posthogClient.recordOf(body)['results']).map((raw) => {
              const org = posthogClient.recordOf(raw);
              return { label: posthogClient.str(org['name']) ?? String(org['id']), value: String(org['id']) };
            }),
          };
        } catch (error) {
          return { disabled: true, options: [], placeholder: error instanceof Error ? error.message : 'Failed to load organizations.' };
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
  async run({ auth, propsValue }) {
    const organizationId = posthogClient.requiredText({ value: propsValue.organization_id, label: 'Organization' });
    const requestBody: Record<string, unknown> = { name: posthogClient.requiredText({ value: propsValue.name, label: 'Project Name' }) };
    const anonymize = posthogClient.parseBoolean({ value: propsValue.anonymize_ips, label: 'Anonymize IPs' });
    if (anonymize !== undefined) requestBody['anonymize_ips'] = anonymize;
    const body = await posthogClient.request({
      auth: auth.props,
      method: HttpMethod.POST,
      path: `/api/organizations/${encodeURIComponent(organizationId)}/projects/`,
      body: requestBody,
    });
    const p = posthogClient.recordOf(body);
    return {
      id: p['id'] ?? null,
      uuid: posthogClient.str(p['uuid']),
      name: posthogClient.str(p['name']),
      api_token: posthogClient.str(p['api_token']),
      organization: posthogClient.str(p['organization']),
      timezone: posthogClient.str(p['timezone']),
      anonymize_ips: p['anonymize_ips'] === true,
      created_at: posthogClient.str(p['created_at']),
      updated_at: posthogClient.str(p['updated_at']),
    };
  },
});
