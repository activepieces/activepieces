import { createAction, Property } from '@activepieces/pieces-framework';
import { dropboxAuth } from '../auth';
import { dropboxCommon } from '../common';
import { uploadLinkOutputSchema } from '../output-schemas';

export const dropboxCreateUploadLink = createAction({
  auth: dropboxAuth,
  name: 'create_dropbox_upload_link',
  classification: 'WRITE',
  displayName: 'Create Upload Link',
  description: 'Create a temporary link for uploading a file',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a temporary URL that accepts a file upload to a fixed Dropbox path without further authentication. Use to hand an upload destination to an external system; use Upload File instead when the flow already holds the file. Not idempotent: each call mints a new link with its own expiry.',
    idempotent: false,
  },
  outputSchema: uploadLinkOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Destination Path',
      description:
        'Where the uploaded file will be written (e.g. /folder/file.txt). Accepts a path or an id (id:abc123).',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Write Mode',
      description:
        'Add keeps any existing file and renames on conflict; Overwrite replaces it.',
      required: false,
      defaultValue: 'add',
      options: {
        options: [
          { label: 'Add', value: 'add' },
          { label: 'Overwrite', value: 'overwrite' },
        ],
      },
    }),
    autorename: Property.Checkbox({
      displayName: 'Auto Rename',
      description: 'Let Dropbox rename the upload if the path conflicts.',
      defaultValue: false,
      required: false,
    }),
    duration: Property.Number({
      displayName: 'Duration (seconds)',
      description:
        'How long the link stays valid, between 60 and 14400 seconds. Defaults to 14400.',
      defaultValue: 14400,
      required: false,
    }),
  },
  async run(context) {
    const duration = context.propsValue.duration ?? 14400;
    if (duration < 60 || duration > 14400) {
      throw new Error('Duration must be between 60 and 14400 seconds.');
    }
    return await dropboxCommon.rpc({
      auth: context.auth.access_token,
      path: '/files/get_temporary_upload_link',
      body: {
        commit_info: {
          path: context.propsValue.path,
          mode: context.propsValue.mode ?? 'add',
          autorename: context.propsValue.autorename ?? false,
        },
        duration,
      },
    });
  },
});
