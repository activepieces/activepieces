import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../../index';
import { PCloudClient } from '../common';

export const pcloudGetFileLink = createAction({
  auth: pcloudAuth,
  name: 'get_file_link',
  displayName: 'Get File Download Link',
  description: 'Get a download link for a file in pCloud',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'ID of the file to get download link for',
      required: true,
    }),
  },
  async run(context) {
    const client = new PCloudClient(context.auth);
    const { fileId } = context.propsValue;

    const result = await client.getFileLink(fileId);

    if (result.result !== 0) {
      throw new Error(result.error || 'Failed to get file link');
    }

    return {
      fileId,
      downloadLink: result.link || null,
      metadata: result.metadata,
    };
  },
});
