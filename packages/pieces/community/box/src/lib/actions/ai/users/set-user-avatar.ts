import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const setUserAvatarAction = createAction({
  auth: boxAuth,
  name: 'box_set_user_avatar',
  displayName: 'Set User Avatar',
  description: 'Adds or replaces the avatar image of a Box user.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Uploads a JPG or PNG image as a user\'s avatar, replacing any current one, and returns the new avatar URLs. Get the ID from List Users or Get Current User; remove an avatar with Delete User Avatar.',
    idempotent: true,
  },
  props: {
    userId: boxAiProps.userId({ required: true }),
    image: Property.File({
      displayName: 'Image',
      description: 'The avatar image, JPG or PNG, up to 1 MB: a URL or base64 content.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const form = new FormData();
    form.append('pic', new Blob([propsValue.image.data]), propsValue.image.filename);
    return await boxClient.uploadForm({
      auth,
      path: `/users/${encodeURIComponent(propsValue.userId)}/avatar`,
      form,
    });
  },
});
