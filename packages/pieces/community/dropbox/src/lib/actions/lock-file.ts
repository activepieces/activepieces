import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { lockResultOutputSchema } from '../output-schemas';

export const dropboxLockFile = createAction({
  auth: dropboxAuth,
  name: 'lock_dropbox_file',
  classification: 'WRITE',
  displayName: 'Lock File',
  description: 'Temporarily lock a file against edits',
  audience: 'ai',
  aiMetadata: {
    description:
      'Locks a Dropbox file so other members cannot edit it until it is unlocked. Use before rewriting a shared file so a concurrent edit cannot be lost; release it with Unlock File. Idempotent: locking an already-locked file leaves it locked.',
    idempotent: true,
  },
  outputSchema: lockResultOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The file to lock. Accepts a path (/folder/file.txt) or an id (id:abc123), but not a rev: value.',
      required: true,
    }),
  },
  async run(context) {
    const response = await dropboxCommon.rpc<{ entries?: unknown }>({
      auth: context.auth.access_token,
      path: '/files/lock_file_batch',
      body: { entries: [{ path: context.propsValue.path }] },
    });
    return dropboxCommon.unwrapEntry({ entries: response.entries, action: 'lock the file' });
  },
});
