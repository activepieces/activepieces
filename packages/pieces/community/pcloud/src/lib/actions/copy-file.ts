import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../../index';
import { PCloudClient } from '../common';

export const pcloudCopyFile = createAction({
  auth: pcloudAuth,
  name: 'copy_file',
  displayName: 'Copy File',
  description: 'Copy a file to another folder in pCloud',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'ID of the file to copy',
      required: true,
    }),
    targetFolderId: Property.Number({
      displayName: 'Target Folder ID',
      description: 'ID of the destination folder',
      required: true,
    }),
    overwrite: Property.Checkbox({
      displayName: 'Overwrite',
      description: 'Overwrite file if it exists in target folder',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const client = new PCloudClient(context.auth);
    const { fileId, targetFolderId, overwrite } = context.propsValue;

    const result = await client.copyFile(
      fileId,
      targetFolderId,
      overwrite ?? false
    );

    if (result.result !== 0) {
      throw new Error(result.error || 'Failed to copy file');
    }

    return result.metadata;
  },
});
