import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { lockResultOutputSchema } from '../output-schemas';

export const dropboxGetFileLock = createAction({
  auth: dropboxAuth,
  name: 'get_dropbox_file_lock',
  classification: 'READ',
  displayName: 'Get File Lock',
  description: 'Check whether a file is locked',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reports whether a Dropbox file is currently locked, who holds the lock and when it was taken. Use to check before editing a shared file rather than attempting a write and handling the failure. Read-only.',
    idempotent: true,
  },
  outputSchema: lockResultOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The file to check. Accepts a path (/folder/file.txt) or an id (id:abc123), but not a rev: value.',
      required: true,
    }),
  },
  async run(context) {
    const response = await dropboxCommon.rpc<{ entries?: unknown }>({
      auth: context.auth.access_token,
      path: '/files/get_file_lock_batch',
      body: { entries: [{ path: context.propsValue.path }] },
    });
    return dropboxCommon.unwrapEntry({ entries: response.entries, action: 'read the file lock' });
  },
});
