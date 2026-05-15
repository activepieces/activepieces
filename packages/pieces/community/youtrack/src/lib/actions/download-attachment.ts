// Action: Download Attachment
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown } from '../common';

export const downloadAttachmentAction = createAction({
  auth: youtrackAuth,
  name: 'download_attachment',
  displayName: 'Download Attachment',
  description: 'Downloads an attachment from an issue and returns it as a Base64-encoded string. Use this with the "Upload to Drive" or "Send Email" actions in your flow.',
  props: {
    issue: issueDropdown,
    attachmentId: Property.ShortText({
      displayName: 'Attachment ID',
      description: 'The attachment database ID (e.g. "134-31"). Use "List Attachments" to find it.',
      required: true,
    }),
  },
  async run(context) {
    const a = context.auth as unknown as { baseUrl: string; apiToken: string };
    const url = a.baseUrl.replace(/\/+$/, '') + '/api/issues/' + context.propsValue.issue +
      '/attachments/' + context.propsValue.attachmentId;
    const r = await fetch(url, {
      method: HttpMethod.GET,
      headers: { 'Authorization': 'Bearer ' + a.apiToken },
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error('Failed to download attachment: ' + JSON.stringify(e)); }

    const buffer = await r.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = r.headers.get('content-type') || 'application/octet-stream';

    return {
      attachment_id: context.propsValue.attachmentId,
      content_type: contentType,
      base64_content: base64,
      size_bytes: buffer.byteLength,
    };
  },
  sampleData: {
    attachment_id: '134-31',
    content_type: 'image/png',
    base64_content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    size_bytes: 67,
  },
});
