import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const deleteFoldersAction = createAction({
  auth: simplyprintAuth,
  name: 'delete_folders',
  displayName: 'Delete Folders',
  description:
    'Delete one or more folders (and everything in them). All-or-nothing: if any folder isn\'t modifiable by the caller, the whole call fails.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently deletes one or more user-file folders and all of their contents, given numeric folder IDs. The call is all-or-nothing: it fails entirely if any listed folder is not modifiable by the caller. Idempotent in effect: re-deleting an already-gone folder converges to the same end state, but verify IDs first since this destroys files.',
    idempotent: true,
  },
  props: {
    folderIds: Property.Array({
      displayName: 'Folder IDs',
      description: 'Numeric folder IDs to delete.',
      required: true,
    }),
  },
  async run(context) {
    const ids = (context.propsValue.folderIds ?? []).map(Number).filter((n) => n > 0);
    if (ids.length === 0) throw new Error('Provide at least one folder ID.');

    // files/DeleteFolder reads `folder` (comma-separated IDs) from $this->GET.
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'files/DeleteFolder',
      queryParams: { folder: ids.join(',') },
    });
  },
});
