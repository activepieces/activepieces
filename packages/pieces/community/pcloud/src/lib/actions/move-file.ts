import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../../';

export const pcloudMoveFile = createAction({
  auth: pcloudAuth,
  name: 'move_pcloud_file',
  description: 'Move a file to another folder in pCloud',
  displayName: 'Move File',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file to move',
      required: true,
    }),
    toFolderId: Property.Number({
      displayName: 'Destination Folder ID',
      description: 'The ID of the destination folder',
      required: true,
    }),
    newName: Property.ShortText({
      displayName: 'New Name',
      description: 'Optional new name for the moved file',
      required: false,
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {
      fileid: context.propsValue.fileId.toString(),
      tofolderid: context.propsValue.toFolderId.toString(),
    };

    if (context.propsValue.newName) {
      queryParams['toname'] = context.propsValue.newName;
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/renamefile',
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to move file: ${result.body.error}`);
    }

    return result.body.metadata;
  },
});
