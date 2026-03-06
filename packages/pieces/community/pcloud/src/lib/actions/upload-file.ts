import {
  createAction,
  Property,
} from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { pCloudAuth, getPCloudBaseUrl } from '../auth';
import { pCloudFolderIdProp } from '../common';

export const uploadFile = createAction({
  auth: pCloudAuth,
  name: 'upload_file',
  displayName: 'Upload File',
  description: 'Upload a file to a pCloud folder.',
  props: {
    folder_id: pCloudFolderIdProp,
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload.',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'File Name',
      description: 'The name to save the file as. If left blank, the original filename is used.',
      required: false,
    }),
    rename_if_exists: Property.Checkbox({
      displayName: 'Rename If Exists',
      description: 'If a file with the same name already exists, rename the new file instead of overwriting.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const auth = context.auth;
    const baseUrl = getPCloudBaseUrl(auth as unknown as { data?: Record<string, unknown> });
    const file = context.propsValue.file;
    const folderId = context.propsValue.folder_id ?? '0';
    const filename = context.propsValue.filename ?? file.filename;
    const renameIfExists = context.propsValue.rename_if_exists ?? false;

    // pCloud upload requires multipart/form-data.
    // The pieces-common httpClient supports FormData payloads.
    const formData = new FormData();
    const blob = new Blob([file.base64], { type: file.extension ? `application/${file.extension}` : 'application/octet-stream' });
    formData.append(filename, blob, filename);

    const queryParams: Record<string, string> = {
      folderid: String(folderId),
      filename,
    };

    if (renameIfExists) {
      queryParams['renameifexists'] = '1';
    }

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${baseUrl}/uploadfile`,
      queryParams,
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
      },
      body: formData,
    });

    return response.body;
  },
});
