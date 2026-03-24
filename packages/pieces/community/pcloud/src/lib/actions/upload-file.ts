import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';

export const uploadFile = createAction({
  auth: pcloudAuth,
  name: 'pcloud_upload_file',
  displayName: 'Upload File',
  description: 'Upload a file to a pCloud folder.',
  props: {
    folder_id: Property.Number({
      displayName: 'Folder ID',
      description: 'The ID of the folder to upload to. Use 0 for the root folder.',
      required: true,
      defaultValue: 0,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload.',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'The name for the uploaded file.',
      required: true,
    }),
  },
  async run(context) {
    const fileData = context.propsValue.file;
    const fileBuffer = Buffer.from(fileData.base64, 'base64');

    const formData = new FormData();
    formData.append(
      'file',
      new Blob([fileBuffer]),
      context.propsValue.filename,
    );

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.pcloud.com/uploadfile',
      queryParams: {
        folderid: context.propsValue.folder_id.toString(),
        filename: context.propsValue.filename,
      },
      body: formData,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    if (response.body.result !== 0) {
      throw new Error(`pCloud upload error: ${response.body.error}`);
    }

    return response.body.metadata?.[0] ?? response.body;
  },
});
