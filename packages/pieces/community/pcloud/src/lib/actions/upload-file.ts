import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../../';

export const pcloudUploadFile = createAction({
  auth: pcloudAuth,
  name: 'upload_pcloud_file',
  description: 'Upload a file to pCloud',
  displayName: 'Upload File',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'The folder ID where the file should be uploaded (0 for root)',
      required: true,
      defaultValue: 0,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'The name for the uploaded file',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload',
      required: true,
    }),
    noPartial: Property.Checkbox({
      displayName: 'No Partial',
      description: 'If set, partially uploaded files will not be saved',
      defaultValue: true,
      required: false,
    }),
  },
  async run(context) {
    const fileData = context.propsValue.file;
    const fileBuffer = Buffer.from(fileData.base64, 'base64');

    const formData = new FormData();
    formData.append('folderid', context.propsValue.folderId.toString());
    formData.append('filename', context.propsValue.filename);
    formData.append('nopartial', context.propsValue.noPartial ? '1' : '0');
    formData.append('file', new Blob([fileBuffer]), context.propsValue.filename);

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.pcloud.com/uploadfile',
      body: formData,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
