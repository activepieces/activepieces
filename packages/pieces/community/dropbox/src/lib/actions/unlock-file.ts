import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { lockResultOutputSchema } from '../output-schemas';

export const dropboxUnlockFile = createAction({
  auth: dropboxAuth,
  name: 'unlock_dropbox_file',
  classification: 'WRITE',
  displayName: 'Unlock File',
  description: 'Release a lock on a file',
  audience: 'ai',
  aiMetadata: {
    description:
      'Releases a lock previously taken on a Dropbox file so other members can edit it again. Use after finishing the write that Lock File protected. Idempotent: unlocking a file that is not locked leaves it unlocked.',
    idempotent: true,
  },
  outputSchema: lockResultOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The file to unlock. Accepts a path (/folder/file.txt) or an id (id:abc123), but not a rev: value.',
      required: true,
    }),
  },
  async run(context) {
    const response = await dropboxCommon.rpc<{ entries?: unknown }>({
      auth: context.auth.access_token,
      path: '/files/unlock_file_batch',
      body: { entries: [{ path: context.propsValue.path }] },
    });
    return dropboxCommon.unwrapEntry({ entries: response.entries, action: 'unlock the file' });
  },
});
