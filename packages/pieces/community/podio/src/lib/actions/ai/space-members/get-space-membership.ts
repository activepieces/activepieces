import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetSpaceMembershipOutputSchema } from '../../../output-schemas';

export const getSpaceMembershipAction = createAction({
  auth: podioAuth,
  name: 'podio_get_space_membership',
  outputSchema: podioGetSpaceMembershipOutputSchema,
  displayName: 'Get Space Membership',
  description: 'Gets one user\'s membership of a space with its role and dates.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one user\'s membership of a space: role, and when they were invited, started and (if ended) left. For the employee flag and grant count use Get Space Member. User ids come from List Space Members.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space, from List Org Spaces or Get Space.' }),
    userId: podioAiProps.id({ required: true, displayName: 'User ID', description: 'The id of the user, from List Space Members.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/space/${propsValue.spaceId}/member/${propsValue.userId}` });
  },
});
