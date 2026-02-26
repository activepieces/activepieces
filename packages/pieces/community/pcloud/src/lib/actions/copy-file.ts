import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../../';

export const pcloudCopyFile = createAction({
  auth: pcloudAuth,
  name: 'copy_pcloud_file',
  description: 'Copy a file to another folder in pCloud',
  displayName: 'Copy File',
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
      displayName: 'New Name',
      description: 'Optional new name for the copied file',
      required: false,
    }),
    overwrite: Property.Checkbox({
      displayName: 'Overwrite',
      description: 'If set, overwrites existing file with the same name',
      defaultValue: false,
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

    if (context.propsValue.overwrite) {
      queryParams['noover'] = '0';
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/copyfile',
      queryParams,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to copy file: ${result.body.error}`);
    }

    return result.body.metadata;
  },
});
