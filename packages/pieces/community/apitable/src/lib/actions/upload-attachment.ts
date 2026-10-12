import { Property, createAction } from '@activepieces/pieces-framework';
import { APITableCommon, makeClient } from '../common';
import { APITableAuth } from '../auth';
import { uploadAttachmentActionOutputSchema } from '../output-schemas';

export const uploadAttachmentAction = createAction({
  auth: APITableAuth,
  name: 'apitable_upload_attachment',
  classification: 'WRITE',
  displayName: 'Upload Attachment',
  description: 'Uploads a file to a datasheet and returns its storage URL.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Uploads a single file to an AITable datasheet and returns its stored token and URL. Use to obtain the URL for a file before writing it into an Attachment field with Create Record or Update Record. Not idempotent: each call stores a new file, so repeating it duplicates the upload.',
    idempotent: false,
  },
  props: {
    space_id: APITableCommon.space_id,
    datasheet_id: APITableCommon.datasheet_id,
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload.',
      required: true,
    }),
  },
  outputSchema: uploadAttachmentActionOutputSchema,
  async run(context) {
    const datasheetId = context.propsValue.datasheet_id as string;
    const file = context.propsValue.file;

    const client = makeClient(context.auth.props);
    const response = await client.uploadAttachment(
      datasheetId,
      file.filename,
      file.data
    );

    if (!response.success) {
      throw new Error(JSON.stringify(response, undefined, 2));
    }

    return response;
  },
});
