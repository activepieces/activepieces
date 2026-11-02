import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { entryOperationOutputSchema } from '../output-schemas';

export const dropboxCopyEntry = createAction({
  auth: dropboxAuth,
  name: 'copy_dropbox_entry',
  classification: 'WRITE',
  displayName: 'Copy Entry',
  description: 'Copy a file or folder',
  audience: 'ai',
  aiMetadata: {
    description:
      'Copies a Dropbox file or folder to a new path, leaving the original in place. Handles both files and folders, so no separate action is needed for each. Use Start Copy Batch for many entries at once. Not idempotent: each call creates another copy, so repeating it conflicts or, with autorename, produces duplicates.',
    idempotent: false,
  },
  outputSchema: entryOperationOutputSchema,
  props: {
    from_path: Property.ShortText({
      displayName: 'From Path',
      description:
        'The file or folder to copy. Accepts a path (/folder/file.txt) or an id (id:abc123).',
      required: true,
    }),
    to_path: Property.ShortText({
      displayName: 'To Path',
      description: 'The destination path, for example /folder2/file.txt.',
      required: true,
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description: 'Let Dropbox rename the copy when the destination conflicts.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/copy_v2',
      body: {
        from_path: context.propsValue.from_path,
        to_path: context.propsValue.to_path,
        autorename: context.propsValue.autorename ?? false,
      },
    });
  },
});
