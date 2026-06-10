// Action: Upload Attachment
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, youtrackApiCall } from '../common';

export const uploadAttachmentAction = createAction({
  auth: youtrackAuth,
  name: 'upload_attachment',
  displayName: 'Upload Attachment',
  description: 'Uploads one or more files as attachments to an existing issue.',
  props: {
    issue: issueDropdown,
    files: Property.Array({
      displayName: 'Files',
      description: 'Add files to attach. Each needs a file name and base64-encoded content.',
      required: true,
      properties: {
        fileName: Property.ShortText({
          displayName: 'File Name',
          description: 'The name the file will have in YouTrack (e.g. "screenshot.png").',
          required: true,
        }),
        fileContent: Property.File({
          displayName: 'File Content (Base64)',
          description: 'The file content as a Base64 string. Use the Text Helper piece to encode files.',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const { baseUrl, apiToken } = context.auth.props;
    const results: Array<{ name: string; id: string }> = [];

    type FileEntry = { fileName: string; fileContent: { base64: string } };
    for (const file of context.propsValue.files as Array<FileEntry>) {
      const binary = Buffer.from(file.fileContent.base64, 'base64');
      const boundary = '----ActivepiecesBoundary' + Date.now();
      const parts: Buffer[] = [];

      parts.push(Buffer.from(
        '--' + boundary + '\r\n' +
        'Content-Disposition: form-data; name="upload"; filename="' + file.fileName.replace(/"/g, '\\"').replace(/\r/g, '').replace(/\n/g, '') + '"\r\n' +
        'Content-Type: application/octet-stream\r\n\r\n',
        'utf-8',
      ));
      parts.push(binary);
      parts.push(Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8'));

      const body = Buffer.concat(parts);
      const response = await youtrackApiCall<Array<{ id: string; name: string }>>({
        baseUrl,
        token: apiToken,
        method: HttpMethod.POST,
        path: '/issues/' + context.propsValue.issue + '/attachments',
        queryParams: { fields: 'id,name' },
        headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary },
        body,
      });
      results.push(...(response.body || []));
    }
    return results;
  },
});
