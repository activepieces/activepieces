import { createAction } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostAiProps } from '../../../common/ai-props';
import { mattermostClient } from '../../../common/client';
import { mattermostDownloadFileOutputSchema } from '../../../output-schemas';

export const getUserImageAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_user_image',
  outputSchema: mattermostDownloadFileOutputSchema,
  displayName: 'Get User Image',
  description: 'Downloads a user\'s profile picture.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads a user\'s current profile picture (the generated default if none was uploaded) and returns it as a file. For the generated default only use Get User Default Image.',
    idempotent: true,
  },
  props: {
    userId: mattermostAiProps.userId({ required: true }),
  },
  async run(context) {
    const { userId } = context.propsValue;
    const download = await mattermostClient.download({
      auth: context.auth,
      path: `/users/${encodeURIComponent(userId)}/image`,
    });
    const fileName = download.fileName ?? `profile-${userId}.png`;
    const file = await context.files.write({ fileName, data: download.data });
    return { file, fileName, contentType: download.contentType, size: download.data.length };
  },
});
