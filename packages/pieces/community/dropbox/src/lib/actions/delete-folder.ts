import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../../';

export const dropboxDeleteFolder = createAction({
  auth: dropboxAuth,
  name: 'delete_dropbox_folder',
  description: 'Delete a folder',
  displayName: 'Delete folder',
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The path of the folder to be deleted (e.g. /folder1)',
      required: true,
    }),
  },
  async run(context) {
    const params = {
      path: context.propsValue.path,
    };

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.dropboxapi.com/2/files/delete_v2`,
      headers: {
        'Content-Type': 'application/json',
      },
      body: params,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
