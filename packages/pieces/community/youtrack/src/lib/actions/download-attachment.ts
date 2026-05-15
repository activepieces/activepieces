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
    const base = a.baseUrl.replace(/\/+$/, '');

    // Step 1: get attachment metadata to find the actual download URL
    const metaUrl = base + '/api/issues/' + context.propsValue.issue +
      '/attachments/' + context.propsValue.attachmentId + '?fields=id,name,url,size,contentType';
    const metaR = await fetch(metaUrl, {
      method: HttpMethod.GET,
      headers: { 'Accept': 'application/json', 'Authorization': 'Bearer ' + a.apiToken },
    });
    if (!metaR.ok) { const e = await metaR.json().catch(() => ({})); throw new Error('Failed to get attachment metadata: ' + JSON.stringify(e)); }
    const meta = await metaR.json() as { url?: string; name?: string; size?: number; contentType?: string };

    // Step 2: download the actual file binary via the signed URL
    const downloadUrl = meta.url || (base + '/api/issues/' + context.propsValue.issue + '/attachments/' + context.propsValue.attachmentId + '/file');
    const r = await fetch(downloadUrl, {
      method: HttpMethod.GET,
      headers: { 'Authorization': 'Bearer ' + a.apiToken },
    });
    if (!r.ok) { const e = await r.json().catch(() => ({})); throw new Error('Failed to download attachment file: ' + JSON.stringify(e)); }

    const buffer = await r.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = meta.contentType || r.headers.get('content-type') || 'application/octet-stream';

    return {
      attachment_id: context.propsValue.attachmentId,
      file_name: meta.name,
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
