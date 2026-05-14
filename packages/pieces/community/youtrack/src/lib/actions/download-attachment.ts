// Action: Download Attachment
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown } from '../common';

export const downloadAttachmentAction = createAction({
  auth: youtrackAuth,
  name: 'download_attachment',
  displayName: 'Download Attachment',
  description: 'Downloads an attachment file from an issue and returns it as a Base64-encoded string. Use this with the "Upload to Drive" or "Send Email" actions in your flow.',
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
    const base = a.baseUrl.replace(/\/+$/, '') + '/api';

    const metaUrl = base + '/issues/' + context.propsValue.issue +
      '/attachments/' + context.propsValue.attachmentId +
      '?fields=url,name,contentType';
    const metaR = await fetch(metaUrl, {
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken },
    });
    if (!metaR.ok) { const e = await metaR.json().catch(() => ({})); throw new Error('Failed to fetch attachment metadata: ' + JSON.stringify(e)); }
    const meta = await metaR.json() as { url?: string; name?: string; contentType?: string };
    if (!meta.url) throw new Error('Attachment URL not found in metadata');

    const fileR = await fetch(meta.url, {
      headers: { 'Authorization': 'Bearer ' + a.apiToken },
    });
    if (!fileR.ok) throw new Error('Failed to download attachment file: ' + fileR.status);

    const buffer = await fileR.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = meta.contentType || fileR.headers.get('content-type') || 'application/octet-stream';

    return {
      attachment_id: context.propsValue.attachmentId,
      filename: meta.name ?? null,
      content_type: contentType,
      base64_content: base64,
      size_bytes: buffer.byteLength,
    };
  },
  sampleData: {
    attachment_id: '134-31',
    filename: 'screenshot.png',
    content_type: 'image/png',
    base64_content: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    size_bytes: 67,
  },
});
