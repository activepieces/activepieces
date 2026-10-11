import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { entryOperationOutputSchema } from '../output-schemas';

export const dropboxMoveEntry = createAction({
  auth: dropboxAuth,
  name: 'move_dropbox_entry',
  classification: 'WRITE',
  displayName: 'Move Entry',
  description: 'Move or rename a file or folder',
  audience: 'ai',
  aiMetadata: {
    description:
      'Moves a Dropbox file or folder to a new path, which also renames it. Handles both files and folders, so no separate action is needed for each. Use Start Move Batch for many entries at once. Not idempotent: once moved, repeating the call fails because the source path no longer exists.',
    idempotent: false,
  },
  outputSchema: entryOperationOutputSchema,
  props: {
    from_path: Property.ShortText({
      displayName: 'From Path',
      description:
        'The file or folder to move. Accepts a path (/folder/file.txt) or an id (id:abc123).',
      required: true,
    }),
    to_path: Property.ShortText({
      displayName: 'To Path',
      description: 'The destination path, for example /folder2/renamed.txt.',
      required: true,
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description: 'Let Dropbox rename the entry when the destination conflicts.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/move_v2',
      body: {
        from_path: context.propsValue.from_path,
        to_path: context.propsValue.to_path,
        autorename: context.propsValue.autorename ?? false,
      },
    });
  },
});
