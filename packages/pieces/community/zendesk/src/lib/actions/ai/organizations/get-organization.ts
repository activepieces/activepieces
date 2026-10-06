import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetOrganizationOutputSchema } from '../../../output-schemas';

export const zendeskGetOrganization = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_organization',
  outputSchema: zendeskGetOrganizationOutputSchema,
  displayName: 'Get Organization',
  description: 'Get an organization by its ID.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches one organization by numeric ID, with domain names, group, notes, tags and organization fields. Use Search Organizations to find one by name or external ID.',
    idempotent: true,
  },
  props: {
    organization_id: zendeskAiProps.requiredId({ displayName: 'Organization ID', description: 'Numeric organization ID, from Search Organizations or List Organizations.' }),
  },
  async run({ auth, propsValue }) {
    const organizationId = zendeskApi.id({ value: propsValue.organization_id, label: 'Organization ID' });
    const response = await zendeskApi.request<{ organization: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/organizations/${organizationId}.json`,
    });
    return response.organization;
  },
});
