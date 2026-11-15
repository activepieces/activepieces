import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { copyReferenceOutputSchema } from '../output-schemas';

export const dropboxCreateCopyReference = createAction({
  auth: dropboxAuth,
  name: 'create_dropbox_copy_reference',
  classification: 'WRITE',
  displayName: 'Create Copy Reference',
  description: 'Create a copy reference for a file or folder',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a copy reference for a Dropbox file or folder, which Save Copy Reference can then use to copy it into a different Dropbox account. Use only for cross-account copies; within one account use Copy Dropbox Entry instead. The response carries the reference and its expiry date. Not idempotent: each call mints a new reference.',
    idempotent: false,
  },
  outputSchema: copyReferenceOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'The file or folder to reference. Accepts a path (/folder/file.txt), an id (id:abc123) or a revision (rev:a1c10ce0dd78).',
      required: true,
    }),
  },
  async run(context) {
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/copy_reference/get',
      body: { path: context.propsValue.path },
    });
  },
});
