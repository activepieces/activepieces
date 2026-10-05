import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { listRevisionsOutputSchema } from '../output-schemas';

export const dropboxListFileRevisions = createAction({
  auth: dropboxAuth,
  name: 'list_dropbox_file_revisions',
  classification: 'READ',
  displayName: 'List File Revisions',
  description: 'List the stored revisions of a file',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the stored revisions of a Dropbox file, newest first, each with its rev identifier and modification time. Use to inspect a file history, or to obtain the rev value that Restore File requires. Read-only.',
    idempotent: true,
  },
  outputSchema: listRevisionsOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The file whose revisions to list. Accepts a path (/folder/file.txt) or an id (id:abc123).',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Mode',
      description:
        'Path returns revisions of whatever currently sits at the path; ID follows the same file across moves and renames.',
      required: false,
      defaultValue: 'path',
      options: {
        options: [
          { label: 'Path', value: 'path' },
          { label: 'ID', value: 'id' },
        ],
      },
    }),
    limit: Property.Number({
      displayName: 'Limit',
      description: 'Maximum revisions to return, between 1 and 100.',
      defaultValue: 10,
      required: false,
    }),
  },
  async run(context) {
    const limit = context.propsValue.limit ?? 10;
    if (limit < 1 || limit > 100) {
      throw new Error('Limit must be between 1 and 100.');
    }
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/list_revisions',
      body: {
        path: context.propsValue.path,
        mode: context.propsValue.mode ?? 'path',
        limit,
      },
    });
  },
});
