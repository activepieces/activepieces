import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskCreateOrganizationMembershipOutputSchema } from '../../../output-schemas';

export const zendeskCreateOrganizationMembership = createAction({
  auth: zendeskAuth,
  name: 'zendesk_create_organization_membership',
  outputSchema: zendeskCreateOrganizationMembershipOutputSchema,
  displayName: 'Create Organization Membership',
  description: 'Add a user to an organization.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Adds a user to an organization. Users can belong to several organizations only when the account allows it; otherwise use Update User with Organization ID. Fails with 422 when the membership already exists. Remove it with Delete Organization Membership.',
    idempotent: false,
  },
  props: {
    user_id: zendeskAiProps.requiredId({ displayName: 'User ID', description: 'Numeric user ID, from Search Users.' }),
    organization_id: zendeskAiProps.requiredId({
      displayName: 'Organization ID',
      description: 'Numeric organization ID, from Search Organizations.',
    }),
    default: zendeskAiProps.optionalBoolean({
      displayName: 'Default',
      description: 'Make this the user default organization for new tickets.',
    }),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ organization_membership: Record<string, unknown> }>({
      auth,
      method: HttpMethod.POST,
      path: '/organization_memberships.json',
      body: {
        organization_membership: zendeskApi.compact({
          user_id: Number(zendeskApi.id({ value: propsValue.user_id, label: 'User ID' })),
          organization_id: Number(zendeskApi.id({ value: propsValue.organization_id, label: 'Organization ID' })),
          default: zendeskApi.optionalBoolean(propsValue.default),
        }),
      },
    });
    return response.organization_membership;
  },
});
