import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';

import { simplyprintAuth } from '../auth';
import { simplyprintClient } from '../common/client';

export const moveFileAction = createAction({
  auth: simplyprintAuth,
  name: 'move_file',
  displayName: 'Move File',
  description: 'Move one or more user files to a different folder.',
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
