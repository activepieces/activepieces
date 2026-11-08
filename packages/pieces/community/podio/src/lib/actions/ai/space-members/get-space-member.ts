import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioGetSpaceMemberOutputSchema } from '../../../output-schemas';

export const getSpaceMemberAction = createAction({
  auth: podioAuth,
  name: 'podio_get_space_member',
  outputSchema: podioGetSpaceMemberOutputSchema,
  displayName: 'Get Space Member',
  description: 'Gets one user\'s profile, role, employee flag and grant count on a space.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Reads one user on a space: their profile, role (blank when they only have grants), whether they are an employee and how many grants they hold there. For invitation and end dates use Get Space Membership. User ids come from List Space Members.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space, from List Org Spaces or Get Space.' }),
    userId: podioAiProps.id({ required: true, displayName: 'User ID', description: 'The id of the user, from List Space Members.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/space/${propsValue.spaceId}/member/${propsValue.userId}/v2` });
  },
});
