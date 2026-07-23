import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import FormData from 'form-data';
import { googleDriveAuth, getAccessToken } from '../auth';

export const driveCreateFileFromText = createAction({
  auth: googleDriveAuth,
  name: 'drive_create_file_from_text',
  displayName: 'Create File from Text',
  description: 'Create a new text file in your Google Drive from text',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new Drive file from inline text content as plain text, CSV, or XML. Use when an agent has generated text it needs to persist as a Drive file; for binary or existing files use `drive_upload_file` instead. Each call creates a new file.',
    idempotent: false,
  },
  props: {
    file_name: Property.ShortText({
      displayName: 'File name',
      description: 'The name of the new text file',
      required: true,
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text content to add to file',
      required: true,
    }),
    content_type: Property.StaticDropdown({
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
    parent_folder_id: Property.ShortText({
      displayName: 'Parent Folder ID',
      description:
        'The ID of the folder to create the file inside. Leave empty to create it in the root of My Drive. Resolve a folder ID with `drive_search_files`.',
      required: false,
    }),
    include_team_drives: Property.Checkbox({
      displayName: 'Include Team Drives',
      description:
        'Determines if folders from Team Drives should be included in the results.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const meta = {
      mimeType: context.propsValue.content_type,
      name: context.propsValue.file_name,
      ...(context.propsValue.parent_folder_id
        ? { parents: [context.propsValue.parent_folder_id] }
        : {}),
    };

    const metaBuffer = Buffer.from(JSON.stringify(meta), 'utf-8');
    const textBuffer = Buffer.from(context.propsValue.text!, 'utf-8');

    const form = new FormData();
    form.append('Metadata', metaBuffer, { contentType: 'application/json' });
    form.append('Media', textBuffer, {
      contentType: context.propsValue.content_type,
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
        token: await getAccessToken(context.auth),
      },
    });

    console.debug('File creation response', result);
    return result.body;
  },
});
