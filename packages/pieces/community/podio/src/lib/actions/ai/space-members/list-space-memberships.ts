import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioListSpaceMembershipsOutputSchema } from '../../../output-schemas';

export const listSpaceMembershipsAction = createAction({
  auth: podioAuth,
  name: 'podio_list_space_memberships',
  outputSchema: podioListSpaceMembershipsOutputSchema,
  displayName: 'List Space Memberships',
  description: 'Lists the active members of a space with their role and join dates.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists every active member of a space with their role and invitation and start dates, unpaged. To filter by member type, search or page, use List Space Members; for one role, List Space Members by Role. The space id comes from List Org Spaces or Get Space.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space, from List Org Spaces or Get Space.' }),
  },
  async run({ auth, propsValue }) {
    const memberships = await podioClient.request<unknown[]>({ auth, method: HttpMethod.GET, path: `/space/${propsValue.spaceId}/member/` });
    return { memberships, count: memberships.length };
  },
});
