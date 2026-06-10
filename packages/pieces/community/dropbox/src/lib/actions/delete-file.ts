import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';

export const dropboxDeleteFile = createAction({
  auth: dropboxAuth,
  name: 'delete_dropbox_file',
  description: 'Delete a file',
  audience: 'both',
  aiMetadata: { description: 'Permanently deletes the file at the given Dropbox path. Use to remove a specific file an agent has resolved the path for. Effectively idempotent on the end state once the path is gone, but a repeat call fails because the path no longer exists; treat as a destructive, non-recoverable mutation.', idempotent: false },
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
