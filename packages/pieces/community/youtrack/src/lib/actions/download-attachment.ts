import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../../';
import { issueDropdown, youtrackApiCall } from '../common';

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
    const { baseUrl, apiToken } = context.auth.props;
    const base = baseUrl.replace(/\/+$/, '');

    const metaResponse = await youtrackApiCall<{ url?: string; name?: string; size?: number; contentType?: string }>({
      baseUrl,
      token: apiToken,
      method: HttpMethod.GET,
      path: '/issues/' + context.propsValue.issue + '/attachments/' + context.propsValue.attachmentId,
      queryParams: { fields: 'id,name,url,size,contentType' },
    });
    const meta = metaResponse.body;

    // fetch() is used here because the download URL may point to an external CDN and
    // the response must be consumed as an ArrayBuffer, which httpClient does not support.
    const downloadUrl = meta.url || (base + '/api/issues/' + context.propsValue.issue + '/attachments/' + context.propsValue.attachmentId + '/file');
    const fileResponse = await fetch(downloadUrl, {
      method: HttpMethod.GET,
      headers: { 'Authorization': 'Bearer ' + apiToken },
    });
    if (!fileResponse.ok) { const e = await fileResponse.json().catch(() => ({})); throw new Error('Failed to download attachment file: ' + JSON.stringify(e)); }

    const buffer = await fileResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const contentType = meta.contentType || fileResponse.headers.get('content-type') || 'application/octet-stream';

    return {
      attachment_id: context.propsValue.attachmentId,
      file_name: meta.name,
      content_type: contentType,
      base64_content: base64,
      size_bytes: buffer.byteLength,
    };
  },
});
