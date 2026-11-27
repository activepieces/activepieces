import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDeleteUserOutputSchema } from '../../../output-schemas';

export const deleteUserAvatarAction = createAction({
  auth: boxAuth,
  name: 'box_delete_user_avatar',
  outputSchema: boxDeleteUserOutputSchema,
  displayName: 'Delete User Avatar',
  description: 'Removes the avatar image of a Box user.',
  audience: 'ai',
  classification: 'DESTRUCTIVE',
  aiMetadata: {
    description:
      'Permanently removes a user\'s avatar image; Set User Avatar can add a new one. Get the ID from List Users or Get Current User.',
    idempotent: false,
  },
  props: {
    userId: boxAiProps.userId({ required: true }),
  },
  async run({ auth, propsValue }) {
    await boxClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/users/${encodeURIComponent(propsValue.userId)}/avatar`,
    });
    return { deleted: true, userId: propsValue.userId };
  },
});
