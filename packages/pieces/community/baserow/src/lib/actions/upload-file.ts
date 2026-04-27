import { Property, createAction } from '@activepieces/pieces-framework';
import { baserowAuth } from '../auth';
import { makeClient } from '../common';

export const uploadFileAction = createAction({
  name: 'baserow_upload_file',
  displayName: 'Upload File',
  description:
    'Uploads a file to Baserow from a URL. Returns the uploaded file object that can be used in file fields.',
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
    return await client.uploadFileFromUrl({ url: url! });
  },
});
