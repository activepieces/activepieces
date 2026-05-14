import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { pCloudAuth } from '../auth';

export const pCloudListFilesAction = createAction({
  auth: pCloudAuth,
  name: 'list_files',
  description: 'List files and folders in a pCloud directory',
  displayName: 'List Files',
  props: {
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The ID of the folder to list (0 for root)',
      required: true,
      defaultValue: '0',
    }),
    recursive: Property.Checkbox({
      displayName: 'Recursive',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { folder_id, recursive } = context.propsValue;
    const { token, region } = context.auth;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `${region}/listfolder`,
      queryParams: {
        auth: token,
        folderid: folder_id,
        recursive: recursive ? '1' : '0',
      },
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
