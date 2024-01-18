import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../..';

export const dropboxGetFileLink = createAction({
  auth: dropboxAuth,
  name: 'get_dropbox_file_link',
  description: 'Get a temporary file link',
  displayName: 'Get temporary file link',
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description: 'The path of the file (e.g. /folder1/file.txt)',
      required: true,
    }),
  },
  async run(context) {
    const params = {
      path: context.propsValue.path,
    };

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.dropboxapi.com/2/files/get_temporary_link`,
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
