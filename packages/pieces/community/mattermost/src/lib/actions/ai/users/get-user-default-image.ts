import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostDownloadFileOutputSchema } from '../../../output-schemas';

export const getUserDefaultImageAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_user_default_image',
  outputSchema: mattermostDownloadFileOutputSchema,
  displayName: 'Get User Default Image',
  description: 'Downloads a user\'s generated default profile picture.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads the generated default profile picture (initials) of a user and returns it as a file, even if they uploaded their own. For the current picture use Get User Image.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
  },
  async run(context) {
    const { userId } = context.propsValue;
    const download = await mattermostClient.download({
      auth: context.auth,
      path: `/users/${encodeURIComponent(userId)}/image/default`,
    });
    const fileName = download.fileName ?? `default-profile-${userId}.png`;
    const file = await context.files.write({ fileName, data: download.data });
    return { file, fileName, contentType: download.contentType, size: download.data.length };
  },
});
