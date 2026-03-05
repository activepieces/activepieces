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
  description: 'Upload a file to a pCloud folder',
  displayName: 'Upload File',
  props: {
    folderId: pcloudCommon.folderIdProp,
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'The name for the uploaded file (e.g. report.pdf)',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload',
      required: true,
    }),
    renameIfExists: Property.Checkbox({
      displayName: 'Rename if exists',
      description:
        'If a file with the same name already exists, rename the new file automatically.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const fileBuffer = Buffer.from(context.propsValue.file.base64, 'base64');

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${pcloudCommon.baseUrl}/uploadfile`,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      queryParams: {
        folderid: context.propsValue.folderId.toString(),
        filename: context.propsValue.filename,
        renameifexists: context.propsValue.renameIfExists ? '1' : '0',
      },
      body: fileBuffer,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    return result.body;
  },
});
