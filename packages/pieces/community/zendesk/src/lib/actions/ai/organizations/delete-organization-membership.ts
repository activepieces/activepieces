import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskDeleteOrganizationMembershipOutputSchema } from '../../../output-schemas';

export const zendeskDeleteOrganizationMembership = createAction({
  auth: zendeskAuth,
  name: 'zendesk_delete_organization_membership',
  outputSchema: zendeskDeleteOrganizationMembershipOutputSchema,
  displayName: 'Delete Organization Membership',
  description: 'Remove a user from an organization.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Removes a user from an organization by deleting the membership; the user and organization remain. The membership ID comes from List Organization Memberships.',
    idempotent: true,
  },
  props: {
    organization_membership_id: zendeskAiProps.requiredId({ displayName: 'Organization Membership ID', description: 'Numeric membership ID, from List Organization Memberships.' }),
  },
  async run({ auth, propsValue }) {
    const organizationMembershipId = zendeskApi.id({ value: propsValue.organization_membership_id, label: 'Organization Membership ID' });
    await zendeskApi.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/organization_memberships/${organizationMembershipId}.json`,
    });
    return { success: true, organization_membership_id: Number(organizationMembershipId) };
  },
});
