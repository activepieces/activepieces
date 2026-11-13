import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostDownloadFileOutputSchema } from '../../../output-schemas';

export const getEmojiImageAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_emoji_image',
  outputSchema: mattermostDownloadFileOutputSchema,
  displayName: 'Get Custom Emoji Image',
  description: 'Downloads the image of a custom emoji.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads a custom emoji\'s image (GIF, PNG or JPEG) and returns it as a file. Takes the emoji ID from List Custom Emojis, Search Custom Emojis or Get Custom Emoji By Name.',
    idempotent: true,
  },
  props: {
    emojiId: Property.ShortText({
      displayName: 'Emoji ID',
      description: 'Custom emoji ID (26 characters). Use List Custom Emojis, Search Custom Emojis or Get Custom Emoji By Name to find it.',
      required: true,
    }),
  },
  async run(context) {
    const { emojiId } = context.propsValue;
    const download = await mattermostClient.download({
      auth: context.auth,
      path: `/emoji/${encodeURIComponent(emojiId)}/image`,
    });
    const extension = download.contentType?.split('/')[1]?.split(';')[0] ?? 'png';
    const fileName = download.fileName ?? `${emojiId}.${extension}`;
    const file = await context.files.write({ fileName, data: download.data });
    return { file, fileName, contentType: download.contentType, size: download.data.length };
  },
});
