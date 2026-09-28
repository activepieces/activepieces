import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { entryOperationOutputSchema } from '../output-schemas';

export const dropboxDeleteEntry = createAction({
  auth: dropboxAuth,
  name: 'delete_dropbox_entry',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Entry',
  description: 'Delete a file or folder',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes a Dropbox file or folder, sending it to trash where it stays restorable rather than erasing it. Deleting a folder also deletes everything inside it. Handles both files and folders, so no separate action is needed for each. Not idempotent: a second call fails because the path is already gone.',
    idempotent: false,
  },
  outputSchema: entryOperationOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The file or folder to delete. Accepts a path (/folder/file.txt) or an id (id:abc123).',
      required: true,
    }),
  },
  async run(context) {
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/delete_v2',
      body: { path: context.propsValue.path },
    });
  },
});
