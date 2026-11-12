import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { dropboxAuth } from '../auth';
import { folderMetadataOutputSchema } from '../output-schemas';

export const dropboxDeleteFolder = createAction({
  auth: dropboxAuth,
  name: 'delete_dropbox_folder',
  classification: 'DESTRUCTIVE',
  description: 'Delete a folder and everything in it',
  audience: 'human',
  aiMetadata: { description: 'Deletes the folder at the given Dropbox path along with all of its contents, moving them to deleted files where they can still be restored. Use to remove an entire directory. Effectively idempotent on the end state once the path is gone, but a repeat call fails because the path no longer exists; treat as a destructive mutation.', idempotent: false },
  displayName: 'Delete Folder',
  outputSchema: folderMetadataOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'Folder to delete. Dropbox keeps it in deleted files for restore.',
      placeholder: '/Reports/old',
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
