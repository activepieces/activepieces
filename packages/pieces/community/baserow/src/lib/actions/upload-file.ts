import { Property, createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';
import { uploadFileOutputSchema } from '../output-schemas';

export const uploadFileAction = createAction({
  name: 'baserow_upload_file',
  classification: 'WRITE',
  outputSchema: uploadFileOutputSchema,
  displayName: 'Upload File',
  description:
    'Uploads a file to Baserow from a URL. Returns the uploaded file object that can be used in file fields.',
  audience: 'both',
  aiMetadata: {
    description:
      'Downloads a file from a public URL and uploads it into Baserow user files, producing a file reference you can then assign to a file field via Create/Update Row. Use as the first step before attaching files to rows. Not idempotent — each call uploads a new file copy.',
    idempotent: false,
  },
  auth: baserowAuth,
  props: {
    url: Property.ShortText({
      displayName: 'File URL',
      description: 'The public URL of the file to upload to Baserow.',
      required: true,
    }),
  },
  async run(context) {
    const { url } = context.propsValue;
    const client = await makeClient(context.auth);
    return await client.uploadFileFromUrl({ url });
  },
});
