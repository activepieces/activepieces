import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const pcloudCopyFile = createAction({
  auth: pcloudAuth,
  name: 'copy_pcloud_file',
  displayName: 'Copy File',
  description: 'Copy a file to another location in pCloud',
  props: {
    fileId: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file to copy',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'File Path',
      description: 'The path to the file to copy. Use fileId or path.',
      required: false,
    }),
    destinationFolderId: Property.Number({
      displayName: 'Destination Folder ID',
      description: 'The destination folder ID',
      required: false,
    }),
    destinationPath: Property.ShortText({
      displayName: 'Destination Path',
      description: 'The destination folder path. Use destinationFolderId or destinationPath.',
      required: false,
    }),
    toName: Property.ShortText({
      displayName: 'New Name',
      description: 'Optional new name for the copied file',
      required: false,
    }),
  },
  async run(context) {
    const params: Record<string, any> = {};
    
    if (context.propsValue.fileId) {
      params.fileid = context.propsValue.fileId;
    } else if (context.propsValue.path) {
      params.path = context.propsValue.path;
    } else {
      throw new Error('Either fileId or path must be provided');
    }

    if (context.propsValue.destinationFolderId !== undefined) {
      params.tofolderid = context.propsValue.destinationFolderId;
    } else if (context.propsValue.destinationPath) {
      params.topath = context.propsValue.destinationPath;
    } else {
      throw new Error('Either destinationFolderId or destinationPath must be provided');
    }

    if (context.propsValue.toName) {
      params.toname = context.propsValue.toName;
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/copyfile',
      queryParams: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to copy file: ${JSON.stringify(result.body)}`);
    }

    return result.body;
  },
});
