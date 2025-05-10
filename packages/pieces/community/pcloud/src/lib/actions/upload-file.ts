import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { PCLOUD_API_URL, API_ENDPOINTS } from '../common/constants';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const uploadFile = createAction({
  name: 'upload-file',
  displayName: 'Upload File',
  description: 'Upload a file to your pCloud storage',
  props: {
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Path',
      description:
        'Path to the folder where the file should be uploaded (e.g., /Documents)',
      required: false,
    }),
    folderId: Property.Number({
      displayName: 'Folder ID',
      description: 'ID of the folder where the file should be uploaded',
      required: false,
    }),
    renameIfExists: Property.Checkbox({
      displayName: 'Rename if Exists',
      description:
        'If enabled, the file will be renamed if a file with the same name exists',
      required: false,
      defaultValue: false,
    }),
    noPartial: Property.Checkbox({
      displayName: 'No Partial Upload',
      description:
        'If enabled, partially uploaded files will not be saved if the connection breaks',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { file, path, folderId, renameIfExists, noPartial } =
      context.propsValue;

    if (!path && !folderId) {
      throw new Error('Either path or folderId must be provided');
    }

    const formData = new FormData();
    const fileBlob = new Blob([file.data]);
    formData.append('file', fileBlob, file.filename);

    if (path) {
      formData.append('path', path);
    }
    if (folderId) {
      formData.append('folderid', folderId.toString());
    }
    if (renameIfExists) {
      formData.append('renameifexists', '1');
    }
    if (noPartial) {
      formData.append('nopartial', '1');
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${PCLOUD_API_URL}${API_ENDPOINTS.UPLOAD_FILE}`,
      body: formData,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as OAuth2PropertyValue).access_token,
      },
    });

    if (response.status === 200) {
      return response.body;
    }

    throw new Error(
      `Failed to upload file: ${response.status} ${
        response.body?.error || 'Unknown error'
      }`
    );
  },
});
