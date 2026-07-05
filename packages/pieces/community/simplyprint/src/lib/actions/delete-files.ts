import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const deleteFilesAction = createAction({
  auth: simplyprintAuth,
  name: 'delete_files',
  displayName: 'Delete Files',
  description:
    'Permanently delete one or more user files by UID. Returns a partial-success report — files the caller can\'t modify are reported in `errors` while accessible files are deleted.',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently delete one or more SimplyPrint files by their UID, identifying them via the file UID strings (look these up with List Files first). Use when the caller wants to remove files from the account; deletion is destructive and not idempotent — re-running with an already-deleted UID surfaces that UID under the partial-success error report rather than succeeding.',
    idempotent: false,
  },
  props: {
    fileUids: Property.Array({
      displayName: 'File UIDs',
      description: 'UID strings of the files to delete. Look up via "List Files".',
      required: true,
    }),
  },
  async run(context) {
    const uids = (context.propsValue.fileUids ?? []).map(String).map((s) => s.trim()).filter((s) => s.length > 0);
    if (uids.length === 0) throw new Error('Provide at least one file UID.');

    // files/DeleteFile reads `file` (comma-separated UIDs) from $this->GET.
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: 'files/DeleteFile',
      queryParams: { file: uids.join(',') },
    });
  },
});
