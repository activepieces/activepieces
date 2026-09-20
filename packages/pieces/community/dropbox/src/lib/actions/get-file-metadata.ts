import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { entryMetadataOutputSchema } from '../output-schemas';

export const dropboxGetFileMetadata = createAction({
  auth: dropboxAuth,
  name: 'get_dropbox_file_metadata',
  classification: 'READ',
  displayName: 'Get File Metadata',
  description: 'Get metadata for a file or folder',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns metadata for a single Dropbox file or folder: name, id, path, size, revision and modification times. Use to inspect one known entry, or to resolve a path into the id and rev that other actions require; use Search Dropbox instead when looking for entries by name. Read-only.',
    idempotent: true,
  },
  outputSchema: entryMetadataOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The file or folder to inspect. Accepts a path (/folder/file.txt), an id (id:abc123) or a revision (rev:a1c10ce0dd78).',
      required: true,
    }),
    include_deleted: Property.Checkbox({
      displayName: 'Include Deleted',
      description:
        'Return metadata for a deleted entry instead of failing when the path no longer exists.',
      defaultValue: false,
      required: false,
    }),
    include_media_info: Property.Checkbox({
      displayName: 'Include Media Info',
      description: 'Include photo and video metadata when available.',
      defaultValue: false,
      required: false,
    }),
    include_has_explicit_shared_members: Property.Checkbox({
      displayName: 'Include Shared Members Flag',
      description:
        'Include whether the entry has explicit shared members assigned.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const body: Record<string, unknown> = {
      path: context.propsValue.path,
      include_deleted: context.propsValue.include_deleted ?? false,
      include_media_info: context.propsValue.include_media_info ?? false,
      include_has_explicit_shared_members:
        context.propsValue.include_has_explicit_shared_members ?? false,
    };
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/get_metadata',
      body,
    });
  },
});
