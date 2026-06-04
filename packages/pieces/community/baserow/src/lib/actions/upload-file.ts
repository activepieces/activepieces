import { Property, createAction } from '@activepieces/pieces-framework';
import { baserowAuth, baserowAuthHelpers } from '../auth';
import { makeClient } from '../common';

export const uploadFileAction = createAction({
  name: 'baserow_upload_file',
  displayName: 'Upload File',
  description:
    'Uploads a file to Baserow from a URL. Returns the uploaded file object that can be used in file fields. Requires Email & Password (JWT) authentication — Database Tokens do not have access to the user-files endpoint.',
  auth: baserowAuth,
  props: {
    url: Property.ShortText({
      displayName: 'File URL',
      description: 'The public URL of the file to upload to Baserow.',
      required: true,
    }),
  },
  async run(context) {
    if (!baserowAuthHelpers.isJwtAuth(context.auth)) {
      throw new Error(
        'Upload File requires Email & Password (JWT) authentication. Database Tokens are limited to row CRUD operations and cannot access the user-files endpoint. Please create a new Baserow connection using Email & Password.'
      );
    }
    const { url } = context.propsValue;
    const client = await makeClient(context.auth);
    return await client.uploadFileFromUrl({ url });
  },
});
