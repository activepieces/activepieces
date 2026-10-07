import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { fileMetadataOutputSchema } from '../output-schemas';

export const dropboxSaveCopyReference = createAction({
  auth: dropboxAuth,
  name: 'save_dropbox_copy_reference',
  classification: 'WRITE',
  displayName: 'Save Copy Reference',
  description: 'Save a copy reference into this account',
  audience: 'ai',
  aiMetadata: {
    description:
      'Saves a copy reference produced by Create Copy Reference into this Dropbox account at the given path. Use to complete a cross-account copy. Not idempotent: each call writes another copy at the destination path.',
    idempotent: false,
  },
  outputSchema: fileMetadataOutputSchema,
  props: {
    copy_reference: Property.ShortText({
      displayName: 'Copy Reference',
      description: 'The reference string returned by Create Copy Reference.',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Destination Path',
      description:
        'Where to save the entry, as a path (/folder/file.txt). This endpoint does not accept id: or ns: values.',
      required: true,
    }),
  },
  async run(context) {
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/copy_reference/save',
      body: {
        copy_reference: context.propsValue.copy_reference,
        path: context.propsValue.path,
      },
    });
  },
});
