import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pcloudAuth } from '../..';
import { pcloudCommon, PcloudCopyFileResponse } from '../common';

export const pcloudCopyFile = createAction({
  auth: pcloudAuth,
  name: 'copy_file',
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
    newName: Property.ShortText({
      displayName: 'New File Name',
      description:
        'Optional new name for the copied file. If not provided, the original name is used.',
      required: false,
    }),
  },
  async run(context) {
    const params: Record<string, string | number | boolean> = {
      fileid: context.propsValue.fileId,
      tofolderid: context.propsValue.toFolderId,
    };
    if (context.propsValue.newName) {
      params['toname'] = context.propsValue.newName;
    }
    const result =
      await pcloudCommon.sendPcloudRequest<PcloudCopyFileResponse>(
        context.auth,
        HttpMethod.GET,
        '/copyfile',
        params,
      );
    return result;
  },
});
