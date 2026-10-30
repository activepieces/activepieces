import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListOrganizationMembershipsOutputSchema } from '../../../output-schemas';

export const zendeskListOrganizationMemberships = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_organization_memberships',
  outputSchema: zendeskListOrganizationMembershipsOutputSchema,
  displayName: 'List Organization Memberships',
  description: 'List which users belong to which organizations.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists organization memberships, each linking a user to an organization and flagging the default one. Pass User ID for one user organizations, or Organization ID for one organization members; omit both for the whole account. Membership IDs feed Delete Organization Membership.',
    idempotent: true,
  },
  props: {
    user_id: zendeskAiProps.optionalId({ displayName: 'User ID', description: 'Only memberships of this user.' }),
    organization_id: zendeskAiProps.optionalId({
      displayName: 'Organization ID',
      description: 'Only memberships of this organization.',
    }),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const userId = zendeskApi.optionalId({ value: propsValue.user_id, label: 'User ID' });
    const organizationId = zendeskApi.optionalId({ value: propsValue.organization_id, label: 'Organization ID' });
    if (userId !== undefined && organizationId !== undefined) {
      throw new Error('Pass User ID or Organization ID, not both.');
    }
    const scope =
      userId !== undefined ? `/users/${userId}` : organizationId !== undefined ? `/organizations/${organizationId}` : '';
    const response = await zendeskApi.request<{ organization_memberships: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `${scope}/organization_memberships.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      organization_memberships: response.organization_memberships,
      count: response.organization_memberships.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
