import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';
import { pCloudAuth } from '../auth';
import FormData from 'form-data';

export const pCloudUploadFileAction = createAction({
  auth: pCloudAuth,
  name: 'upload_file',
  description: 'Upload a file to pCloud',
  displayName: 'Upload File',
  props: {
    file: Property.File({
      displayName: 'File',
      required: true,
    }),
    folder_id: Property.ShortText({
      displayName: 'Folder ID',
      description: 'The ID of the folder where the file will be uploaded (0 for root)',
      required: true,
      defaultValue: '0',
    }),
    rename_if_exists: Property.Checkbox({
      displayName: 'Rename if exists',
      required: false,
      defaultValue: true,
    }),
  },
  async run(context) {
    const { file, folder_id, rename_if_exists } = context.propsValue;
    const { token, region } = context.auth;

    const form = new FormData();
    form.append('file', file.data, file.filename);

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${region}/uploadfile`,
      queryParams: {
        auth: token,
        folderid: folder_id,
        renameifexists: rename_if_exists ? '1' : '0',
      },
      body: form,
      headers: form.getHeaders(),
    };

    const response = await httpClient.sendRequest(request);
    return response.body;
  },
});
