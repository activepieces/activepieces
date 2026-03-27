import { createAction, Property } from '@activepieces/pieces-framework';
import { pcloudAuth } from '../auth';
import { common, PcloudCopyFileResponse } from '../common';

export const pcloudCopyFile = createAction({
  auth: pcloudAuth,
  name: 'pcloud_copy_file',
  displayName: 'Copy File',
  description: 'Copy an existing file to a given folder.',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file to copy',
      required: true,
    }),
    toFolderId: Property.Number({
      displayName: 'Destination Folder ID',
      description: 'The ID of the destination folder',
      required: true,
    }),
  },
  async run(context) {
    const result = await common.pcloudRequest<PcloudCopyFileResponse>(
      context.auth,
      'copyfile',
      {
        fileid: context.propsValue.fileId,
        tofolderid: context.propsValue.toFolderId,
      },
    );
    return result;
  },
});
