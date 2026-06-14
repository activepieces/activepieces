import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';

export const dropboxDeleteFolder = createAction({
  auth: dropboxAuth,
  name: 'delete_dropbox_folder',
  description: 'Delete a folder',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes the folder at the given Dropbox path along with all of its contents. Use to remove an entire directory. Effectively idempotent on the end state once the path is gone, but a repeat call fails because the path no longer exists; treat as a destructive, non-recoverable mutation.', idempotent: false },
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
