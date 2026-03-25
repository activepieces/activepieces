import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { pcloudAuth } from '../auth';
import { pcloudCommon } from '../common';

export const pcloudUploadFile = createAction({
  auth: pcloudAuth,
  name: 'upload_pcloud_file',
  description: 'Upload a file to pCloud',
  displayName: 'Upload File',
  props: {
    folderId: Property.Number({
      displayName: 'Folder ID',
      description:
        'The ID of the folder to upload the file to. Use 0 for root folder.',
      required: true,
      defaultValue: 0,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file URL or base64 to upload',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description:
        'The name to give the uploaded file (e.g., document.pdf)',
      required: true,
    }),
    overwrite: Property.Checkbox({
      displayName: 'Overwrite',
      description:
        'If a file with the same name exists in the folder, overwrite it.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const fileData = context.propsValue.file;
    const fileBuffer = Buffer.from(fileData.base64, 'base64');

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${pcloudCommon.baseUrl}/uploadfile`,
      body: fileBuffer,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      queryParams: {
        folderid: context.propsValue.folderId.toString(),
        filename: context.propsValue.fileName,
        overwrite: context.propsValue.overwrite ? '1' : '0',
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
