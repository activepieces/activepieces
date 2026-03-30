import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const pcloudListFiles = createAction({
  auth: pcloudAuth,
  name: 'list_pcloud_files',
  displayName: 'List Files',
  description: 'List files and folders in a pCloud folder',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'The folder ID to list (use 0 for root folder)',
      required: false,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The folder path to list (e.g., /folder1). Use folderId or path.',
      required: false,
    }),
    recursive: Property.Checkbox({
      displayName: 'Recursive',
      description: 'If set, list all subfolders recursively',
      defaultValue: false,
      required: false,
    }),
    noFiles: Property.Checkbox({
      displayName: 'Folders Only',
      description: 'If set, only return folders (no files)',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const params: Record<string, any> = {};
    
    if (context.propsValue.folderId !== undefined) {
      params.folderid = context.propsValue.folderId;
    } else if (context.propsValue.path) {
      params.path = context.propsValue.path;
    } else {
      // Default to root folder
      params.folderid = 0;
    }

    if (context.propsValue.recursive) {
      params.recursive = 1;
    }

    if (context.propsValue.noFiles) {
      params.nofiles = 1;
    }

    const result = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/listfolder',
      queryParams: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (result.body.result !== 0) {
      throw new Error(`Failed to list folder: ${JSON.stringify(result.body)}`);
    }

    return result.body;
  },
});
