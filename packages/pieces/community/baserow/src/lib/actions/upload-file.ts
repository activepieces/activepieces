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
    'Uploads a file from a link, ready to put in a file column.',
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
      description: 'A public link Baserow can download the file from.',
      placeholder: 'https://example.com/invoice.pdf',
      required: true,
    }),
  },
  async run(context) {
    const { url } = context.propsValue;
    const client = await makeClient(context.auth);
    return await client.uploadFileFromUrl({ url });
  },
});
