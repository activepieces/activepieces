import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskOrganizationFields } from './organization-fields';
import { zendeskGetOrganizationOutputSchema } from '../../../output-schemas';

export const zendeskUpdateOrganization = createAction({
  auth: zendeskAuth,
  name: 'zendesk_update_organization',
  outputSchema: zendeskGetOrganizationOutputSchema,
  displayName: 'Update Organization',
  description: 'Change fields on an existing organization.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Updates one organization by ID; omitted fields keep their values. Tags and Domain Names replace the whole list, so prefer Add Organization Tags or Remove Organization Tags for tags. Requires an admin or an agent allowed to manage organizations.',
    idempotent: true,
  },
  props: {
    organization_id: zendeskAiProps.requiredId({
      displayName: 'Organization ID',
      description: 'Numeric organization ID, from Search Organizations or List Organizations.',
    }),
    ...zendeskOrganizationFields.props({ nameRequired: false }),
  },
  async run({ auth, propsValue }) {
    const organizationId = zendeskApi.id({ value: propsValue.organization_id, label: 'Organization ID' });
    const organization = zendeskOrganizationFields.body(propsValue);
    if (Object.keys(organization).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const response = await zendeskApi.request<{ organization: Record<string, unknown> }>({
      auth,
      method: HttpMethod.PUT,
      path: `/organizations/${organizationId}.json`,
      body: { organization },
    });
    return response.organization;
  },
});
