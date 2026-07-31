import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { googleDriveAuth, getAccessToken } from '../auth';
import mime from 'mime-types';
import { driveUploadFileOutputSchema } from '../output-schemas';

export const driveUploadFile = createAction({
  auth: googleDriveAuth,
  name: 'drive_upload_file',
  displayName: 'Upload File',
  description: 'Upload a file in your Google Drive',
  audience: 'ai',
  aiMetadata: {
    description:
      'Uploads a binary file (from a URL or base64 input) into Drive; MIME type is inferred from the extension. Use to store an existing file or attachment; for plain generated text use `drive_create_file_from_text`, and to fetch a remote URL server-side use `drive_upload_from_url`. Each call creates a new file.',
    idempotent: false,
  },
  outputSchema: driveUploadFileOutputSchema,
  props: {
    file_name: Property.ShortText({
      displayName: 'File name',
      description: 'The name of the file',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file URL or base64 to upload',
      required: true,
    }),
    parent_folder_id: Property.ShortText({
      displayName: 'Parent Folder ID',
      description:
        'The ID of the folder to upload the file into. Leave empty to upload to the root of My Drive. Resolve a folder ID with `drive_search_files`.',
      required: false,
    }),
  },
  async run(context) {
    const fileData = context.propsValue.file;
    const mimeType = mime.lookup(fileData.extension ? fileData.extension : '');

    const meta = {
      mimeType: mimeType,
      name: context.propsValue.file_name,
      ...(context.propsValue.parent_folder_id
        ? { parents: [context.propsValue.parent_folder_id] }
        : {}),
    };

    const metaBuffer = Buffer.from(JSON.stringify(meta), 'utf-8');
    const fileBuffer = Buffer.from(fileData.base64, 'base64');

    const form = new FormData();
    form.append('Metadata', metaBuffer, { contentType: 'application/json' });
    form.append('Media', fileBuffer);

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://www.googleapis.com/upload/drive/v3/files`,
      queryParams: {
        uploadType: 'multipart',
        supportsAllDrives: 'true',
      },
      body: form,
      headers: {
        ...form.getHeaders(),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: await getAccessToken(context.auth),
      },
    });

    return result.body;
  },
});
