import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';
import { fileMetadataOutputSchema } from '../output-schemas';

export const dropboxDeleteFile = createAction({
  auth: dropboxAuth,
  name: 'delete_dropbox_file',
  classification: 'DESTRUCTIVE',
  description: 'Delete a file; it can be restored from Dropbox',
  audience: 'human',
  aiMetadata: { description: 'Deletes the file at the given Dropbox path, moving it to deleted files where it can still be restored. Use to remove a specific file an agent has resolved the path for. Effectively idempotent on the end state once the path is gone, but a repeat call fails because the path no longer exists; treat as a destructive mutation.', idempotent: false },
  displayName: 'Delete File',
  outputSchema: fileMetadataOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'File to delete. Dropbox keeps it in deleted files for restore.',
      placeholder: '/Reports/q1.pdf',
      required: true,
    }),
  },
  async run(context) {
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
