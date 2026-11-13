import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostArchiveChannelOutputSchema } from '../../../output-schemas';

export const setUserImageAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_set_user_image',
  outputSchema: mattermostArchiveChannelOutputSchema,
  displayName: 'Set User Image',
  description: 'Uploads a new profile picture for a user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Replaces a user\'s profile picture with the given image (PNG, JPEG, GIF or BMP). Setting another user\'s picture needs permission to edit other users. To go back to the generated default use Reset User Image.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
    image: Property.File({
      displayName: 'Image',
      description: 'Image file (PNG, JPEG, GIF or BMP) to use as the profile picture.',
      required: true,
    }),
  },
  async run(context) {
    const { userId, image } = context.propsValue;
    const form = new FormData();
    form.append('image', new Blob([new Uint8Array(image.data)]), image.filename);
    return await mattermostClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.POST,
      path: `/users/${encodeURIComponent(userId)}/image`,
      body: form,
    });
  },
});
