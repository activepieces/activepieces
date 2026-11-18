import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostDownloadFileOutputSchema } from '../../../output-schemas';

export const getFileThumbnailAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_get_file_thumbnail',
  outputSchema: mattermostDownloadFileOutputSchema,
  displayName: 'Get File Thumbnail',
  description: 'Downloads a small thumbnail of an image file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads the small JPEG thumbnail Mattermost made for an image file. Only image files have one; others fail. Needs read access to the file\'s channel.',
    idempotent: true,
  },
  props: {
    fileId: Property.ShortText({
      displayName: 'File ID',
      description: 'File ID (26 characters). Use Upload File, Search Files or List Post Files to find it.',
      required: true,
    }),
  },
  async run(context) {
    const { fileId } = context.propsValue;
    const download = await mattermostClient.download({
      auth: context.auth,
      path: `/files/${encodeURIComponent(fileId)}/thumbnail`,
    });
    const fileName = download.fileName ?? `${fileId}-thumbnail.jpg`;
    const file = await context.files.write({ fileName, data: download.data });
    return { file, fileName, contentType: download.contentType, size: download.data.length };
  },
});
