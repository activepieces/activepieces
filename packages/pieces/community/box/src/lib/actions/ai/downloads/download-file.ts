import { createAction, Property } from '@activepieces/pieces-framework';
import { boxAuth } from '../../../auth';
import { boxAiProps } from '../../../common/ai-props';
import { boxClient } from '../../../common/client';

export const downloadFileAction = createAction({
  auth: boxAuth,
  name: 'box_download_file',
  displayName: 'Download File',
  description: 'Downloads the content of a Box file.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Downloads a Box file (or one past version) and returns it as a file the flow can pass on. Get the ID from List Folder Items or Search, and version IDs from List File Versions.',
    idempotent: true,
  },
  props: {
    fileId: boxAiProps.fileId({ required: true }),
    version: boxAiProps.fileVersionId({
      required: false,
      displayName: 'Version ID',
      description: 'ID of a past version to download. Defaults to the current version.',
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'Name for the downloaded file. Defaults to "<file ID>".',
      required: false,
    }),
  },
  async run({ auth, propsValue, files }) {
    const download = await boxClient.download({
      auth,
      path: `/files/${encodeURIComponent(propsValue.fileId)}/content`,
      query: { version: propsValue.version },
    });
    const fileName = propsValue.fileName ?? propsValue.fileId;
    const file = await files.write({ fileName, data: download.data });
    return { file, fileName, contentType: download.contentType, size: download.data.length };
  },
});
