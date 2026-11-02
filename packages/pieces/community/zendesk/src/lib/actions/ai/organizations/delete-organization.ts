import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskDeleteOrganizationOutputSchema } from '../../../output-schemas';

export const zendeskDeleteOrganization = createAction({
  auth: zendeskAuth,
  name: 'zendesk_delete_organization',
  outputSchema: zendeskDeleteOrganizationOutputSchema,
  displayName: 'Delete Organization',
  description: 'Delete an organization.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently deletes one organization; its users and tickets remain but lose the association. Cannot be undone. Requires an admin.',
    idempotent: false,
  },
  props: {
    organization_id: zendeskAiProps.requiredId({ displayName: 'Organization ID', description: 'Numeric organization ID, from Search Organizations or List Organizations.' }),
  },
  async run({ auth, propsValue }) {
    const organizationId = zendeskApi.id({ value: propsValue.organization_id, label: 'Organization ID' });
    await zendeskApi.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/organizations/${organizationId}.json`,
    });
    return { success: true, organization_id: Number(organizationId) };
  },
});
