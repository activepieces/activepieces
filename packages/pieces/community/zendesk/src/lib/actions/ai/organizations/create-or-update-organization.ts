import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskOrganizationFields } from './organization-fields';
import { zendeskCreateOrUpdateOrganizationOutputSchema } from '../../../output-schemas';

export const zendeskCreateOrUpdateOrganization = createAction({
  auth: zendeskAuth,
  name: 'zendesk_create_or_update_organization',
  outputSchema: zendeskCreateOrUpdateOrganizationOutputSchema,
  displayName: 'Create or Update Organization',
  description: 'Update the organization with this external ID, or create one.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Upserts one organization: Zendesk matches an existing organization by External ID and updates the given fields, otherwise creates it with Name. created is true when a new organization was made. Safe to retry. Use Update Organization when you already hold the organization ID.',
    idempotent: true,
  },
  props: zendeskOrganizationFields.props({ nameRequired: true }),
  async run({ auth, propsValue }) {
    if (!propsValue.external_id) {
      throw new Error('Pass External ID so Zendesk can match an existing organization.');
    }
    const response = await zendeskApi.send<{ organization: Record<string, unknown> }>({
      auth,
      method: HttpMethod.POST,
      path: '/organizations/create_or_update.json',
      body: { organization: zendeskOrganizationFields.body(propsValue) },
    });
    return { created: response.status === 201, organization: response.body.organization };
  },
});
