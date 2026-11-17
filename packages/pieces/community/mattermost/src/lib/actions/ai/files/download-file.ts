import { createAction, Property } from '@activepieces/pieces-framework';
import { mattermostAuth } from '../../../auth';
import { mattermostClient } from '../../../common/client';
import { mattermostDownloadFileOutputSchema } from '../../../output-schemas';

export const downloadFileAction = createAction({
  auth: mattermostAuth,
  name: 'mattermost_download_file',
  outputSchema: mattermostDownloadFileOutputSchema,
  displayName: 'Download File',
  description: 'Downloads a file uploaded to Mattermost.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads a file uploaded to Mattermost and returns it as a file. Needs read access to the file\'s channel. Use Get File Info for the name, size and type without downloading.',
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
      path: `/files/${encodeURIComponent(fileId)}`,
    });
    const fileName = download.fileName ?? fileId;
    const file = await context.files.write({ fileName, data: download.data });
    return { file, fileName, contentType: download.contentType, size: download.data.length };
  },
});
