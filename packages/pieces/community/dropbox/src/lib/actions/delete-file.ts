import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../../';

export const dropboxDeleteFile = createAction({
  auth: dropboxAuth,
  name: 'delete_dropbox_file',
  description: 'Delete a file',
  displayName: 'Delete file',
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The path of the file to be deleted (e.g. /folder1/file.txt)',
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
      body: { path: context.propsValue.path },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
