import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { googleDriveAuth } from '../../';
import mime from 'mime-types';
import { common } from '../common';

export const googleDriveUploadFile = createAction({
  auth: googleDriveAuth,
  name: 'upload_gdrive_file',
  description: 'Upload a file in your Google Drive',
  displayName: 'Upload file',
  props: {
    fileName: Property.ShortText({
      displayName: 'File name',
      description: 'The name of the file',
      required: true,
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file URL or base64 to upload',
      required: true,
    }),
    parentFolder: common.properties.parentFolder,
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const fileData = context.propsValue.file;
    const mimeType = mime.lookup(fileData.extension ? fileData.extension : '');

    const meta = {
      mimeType: mimeType,
      name: context.propsValue.fileName,
      ...(context.propsValue.parentFolder
        ? { parents: [context.propsValue.parentFolder] }
        : {}),
    };

    const metaBuffer = Buffer.from(JSON.stringify(meta), 'utf-8');
    const fileBuffer = Buffer.from(fileData.base64, 'base64');

    const form = new FormData();
    form.append('Metadata', metaBuffer, { contentType: 'application/json' });
    form.append('Media', fileBuffer);

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true`,
      body: form,
      headers: {
        ...form.getHeaders(),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    console.debug('File upload response', result);
    return result.body;
  },
});
