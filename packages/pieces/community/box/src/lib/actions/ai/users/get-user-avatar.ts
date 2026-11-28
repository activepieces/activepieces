import { createAction } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';
import { boxDownloadFileOutputSchema } from '../../../output-schemas';

export const getUserAvatarAction = createAction({
  auth: boxAuth,
  name: 'box_get_user_avatar',
  outputSchema: boxDownloadFileOutputSchema,
  displayName: 'Get User Avatar',
  description: 'Gets the avatar image of a Box user.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Returns a user\'s avatar image as a downloadable file. Get the ID from List Users or Get Current User.',
    idempotent: true,
  },
  props: {
    userId: boxAiProps.userId({ required: true }),
  },
  async run({ auth, propsValue, files }) {
    const avatar = await boxClient.download({
      auth,
      path: `/users/${encodeURIComponent(propsValue.userId)}/avatar`,
    });
    const fileName = `${propsValue.userId}-avatar.${avatar.contentType === 'image/png' ? 'png' : 'jpg'}`;
    const file = await files.write({ fileName, data: avatar.data });
    return { file, fileName, contentType: avatar.contentType, size: avatar.data.length };
  },
});
