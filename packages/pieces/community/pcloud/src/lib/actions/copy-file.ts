import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const copyFile = createAction({
  auth: pcloudAuth,
  name: 'pcloud_copy_file',
  displayName: 'Copy File',
  description: 'Copy an existing file to another folder in pCloud.',
  props: {
    file_id: Property.Number({
      displayName: 'File ID',
      description: 'The ID of the file to copy.',
      required: true,
    }),
    to_folder_id: Property.Number({
      displayName: 'Destination Folder ID',
      description: 'The ID of the folder to copy the file into.',
      required: true,
    }),
    new_name: Property.ShortText({
      displayName: 'New Name',
      description: 'Optional new name for the copied file.',
      required: false,
    }),
  },
  async run(context) {
    const params: Record<string, string> = {
      fileid: context.propsValue.file_id.toString(),
      tofolderid: context.propsValue.to_folder_id.toString(),
    };

    if (context.propsValue.new_name) {
      params['toname'] = context.propsValue.new_name;
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: 'https://api.pcloud.com/copyfile',
      queryParams: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (response.body.result !== 0) {
      throw new Error(`pCloud error: ${response.body.error}`);
    }

    return response.body.metadata;
  },
});
