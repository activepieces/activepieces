import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { googleDriveAuth, getAccessToken } from '../auth';
import mime from 'mime-types';

export const driveReplaceFileContent = createAction({
  auth: googleDriveAuth,
  name: 'drive_replace_file_content',
  displayName: 'Replace File Content',
  description: "Replace an existing Drive file's bytes, keeping its ID and name.",
  audience: 'ai',
  aiMetadata: {
    description:
      "Replaces the contents of an existing Drive file with new bytes, keeping the same file ID, name, and location. Use to update a file in place (e.g. overwrite a report); to create a brand-new file use `drive_upload_file`, and to rename without changing content use `drive_update_file_metadata`. Each call overwrites the previous content.",
    idempotent: false,
  },
  props: {
    file_id: Property.ShortText({
      displayName: 'File ID',
      description:
        'The ID of the existing file whose content to replace. Resolve it via `drive_search_files` or `drive_get_file`.',
      required: true,
    }),
    file: Property.File({
      displayName: 'New File Content',
      description: 'The file URL or base64 whose bytes will replace the existing content.',
      required: true,
    }),
    mime_type: Property.ShortText({
      displayName: 'MIME Type',
      description:
        'Optional MIME type for the new content (e.g. application/pdf). Provide this when the source has no file extension; otherwise the type is inferred from the extension.',
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
    const { file_id, file, mime_type } = context.propsValue;

    const resolvedMimeType =
      mime_type ||
      mime.lookup(file.extension ? file.extension : '') ||
      'application/octet-stream';

    const fileBuffer = Buffer.from(file.base64, 'base64');

    const result = await httpClient.sendRequest({
      method: HttpMethod.PATCH,
      url: `https://www.googleapis.com/upload/drive/v3/files/${file_id}`,
      queryParams: {
        uploadType: 'media',
        supportsAllDrives: String(
          context.propsValue.include_team_drives || false
        ),
      },
      body: fileBuffer,
      headers: {
        'Content-Type': resolvedMimeType,
      },
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: await getAccessToken(context.auth),
      },
    });

    return result.body;
  },
});
