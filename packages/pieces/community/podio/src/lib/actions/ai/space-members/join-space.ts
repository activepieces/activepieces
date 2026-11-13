import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { podioAuth } from '../../../auth';
import { podioAiProps } from '../../../common/ai-props';
import { podioClient } from '../../../common/client';

export const joinSpaceAction = createAction({
  auth: podioAuth,
  name: 'podio_join_space',
  displayName: 'Join Space',
  description: 'Makes the connected user a member of an open space.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Joins an open space in the connected user\'s organization directly; closed spaces cannot be joined this way. The space id comes from Get Available Spaces or List Org Spaces.',
    idempotent: true,
  },
  props: {
    spaceId: podioAiProps.id({ required: true, displayName: 'Space ID', description: 'The id of the space, from List Org Spaces or Get Space.' }),
  },
  async run({ auth, propsValue }) {
    return await podioClient.request<unknown>({ auth, method: HttpMethod.POST, path: `/space/${propsValue.spaceId}/join` });
  },
});
