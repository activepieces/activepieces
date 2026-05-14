// Action: Upload Attachment
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown } from '../common';

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
        fileContent: Property.LongText({
          displayName: 'File Content (Base64)',
          description: 'The file content as a Base64 string. Use the Text Helper piece to encode files.',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const results: Array<{ name: string; id: string }> = [];

    for (const file of context.propsValue.files) {
      const binary = Buffer.from(file.fileContent as string, 'base64');
      const boundary = '----ActivepiecesBoundary' + Date.now();
      const parts: Buffer[] = [];

      parts.push(Buffer.from(
        '--' + boundary + '\r\n' +
        'Content-Disposition: form-data; name="upload"; filename="' + file.fileName + '"\r\n' +
        'Content-Type: application/octet-stream\r\n\r\n',
        'utf-8',
      ));
      parts.push(binary);
      parts.push(Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8'));

      const body = Buffer.concat(parts);
      const url = a.baseUrl.replace(/\/+$/, '') + '/api/issues/' + context.propsValue.issue + '/attachments?fields=id,name';
      const r = await fetch(url, {
        method: HttpMethod.POST,
        headers: {
          'Authorization': 'Bearer ' + a.apiToken,
          'Content-Type': 'multipart/form-data; boundary=' + boundary,
        },
        body,
      });
      const data = await r.json() as Array<{ id: string; name: string }>;
      if (!r.ok) throw new Error('Failed to upload "' + file.fileName + '": ' + JSON.stringify(data));
      results.push(...(data || []));
    }
    return results;
  },
  sampleData: [{ id: '134-31', name: 'screenshot.png' }],
});
