import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';
import { podioCountSpaceMembersOutputSchema } from '../../../output-schemas';

export const countSpaceMembersAction = createAction({
  auth: podioAuth,
  name: 'podio_count_space_members',
  outputSchema: podioCountSpaceMembersOutputSchema,
  displayName: 'Count Space Members',
  description: 'Counts the internal and external members of a space.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns how many internal (employee) and external members a space has, without listing them; use List Space Members for the members themselves. The space id comes from List Org Spaces or Get Space.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space, from List Org Spaces or Get Space.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.GET, path: `/space/${propsValue.spaceId}/member/total` });
  },
});
