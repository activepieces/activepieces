import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { googleDriveAuth } from '../../';
import { common } from '../common';

export const googleDriveCreateNewTextFile = createAction({
  auth: googleDriveAuth,
  name: 'create_new_gdrive_file',
  description: 'Create a new text file in your Google Drive from text',
  displayName: 'Create new file',
  props: {
    fileName: Property.ShortText({
      displayName: 'File name',
      description: 'The name of the new text file',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text content to add to file',
      required: true,
    }),
    fileType: Property.StaticDropdown({
      displayName: 'Content type',
      description: 'Select file type',
      required: true,
      defaultValue: 'plain/text',
      options: {
        options: [
          {
            label: 'Text',
            value: 'plain/text',
          },
          {
            label: 'CSV',
            value: 'text/csv',
          },
          {
            label: 'XML',
            value: 'text/xml',
          },
        ],
      },
    }),
    parentFolder: common.properties.parentFolder,
    include_team_drives: common.properties.include_team_drives,
  },
  async run(context) {
    const meta = {
      mimeType: context.propsValue.fileType,
      name: context.propsValue.fileName,
      ...(context.propsValue.parentFolder
        ? { parents: [context.propsValue.parentFolder] }
        : {}),
    };

    const metaBuffer = Buffer.from(JSON.stringify(meta), 'utf-8');
    const textBuffer = Buffer.from(context.propsValue.text!, 'utf-8');

    const form = new FormData();
    form.append('Metadata', metaBuffer, { contentType: 'application/json' });
    form.append('Media', textBuffer, {
      contentType: context.propsValue.fileType,
    });

    const result = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart`,
      body: form,
      headers: {
        ...form.getHeaders(),
      },
      queryParams: {
        supportsAllDrives: String(context.propsValue.include_team_drives || false),
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
    });

    console.debug('File creation response', result);
    return result.body;
  },
});
