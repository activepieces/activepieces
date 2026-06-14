import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const moveFileAction = createAction({
  auth: simplyprintAuth,
  name: 'move_file',
  displayName: 'Move File',
  description: 'Move one or more user files to a different folder.',
  audience: 'both',
  aiMetadata: {
    description:
      'Moves one or more user files into a target folder, identified by user-file UID(s) (comma-separate to move several at once) and a destination folder ID (0 for root). Look up UIDs via "List Files". Idempotent: moving files already in the target folder leaves them in the same place.',
    idempotent: true,
  },
  props: {
    fileUids: Property.ShortText({
      displayName: 'File UID(s)',
      description:
        'User-file UID string. Comma-separate to move several files at once. Use "List Files" to look up UIDs.',
      required: true,
    }),
    targetFolderId: Property.Number({
      displayName: 'Target folder ID',
      description: 'Destination folder. Use 0 for the root folder.',
      required: true,
    }),
  },
  async run(context) {
    return await simplyprintClient.simplyprintCall({
      auth: context.auth,
      method: HttpMethod.GET,
      path: 'files/MoveFiles',
      queryParams: {
        files: String(context.propsValue.fileUids),
        folder: String(context.propsValue.targetFolderId ?? 0),
      },
    });
  },
});
