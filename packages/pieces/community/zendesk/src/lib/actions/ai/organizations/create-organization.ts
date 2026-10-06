import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskOrganizationFields } from './organization-fields';
import { zendeskGetOrganizationOutputSchema } from '../../../output-schemas';

export const zendeskCreateOrganization = createAction({
  auth: zendeskAuth,
  name: 'zendesk_create_organization',
  outputSchema: zendeskGetOrganizationOutputSchema,
  displayName: 'Create Organization',
  description: 'Create an organization.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Creates one organization. Fails with 422 when the name is already taken, so use Create or Update Organization to avoid duplicates, or Search Organizations first. Not idempotent. Requires an admin or an agent allowed to manage organizations.',
    idempotent: false,
  },
  props: zendeskOrganizationFields.props({ nameRequired: true }),
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ organization: Record<string, unknown> }>({
      auth,
      method: HttpMethod.POST,
      path: '/organizations.json',
      body: { organization: zendeskOrganizationFields.body(propsValue) },
    });
    return response.organization;
  },
});
