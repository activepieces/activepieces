import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { issueDropdown } from '../common';
import { youtrackClient } from '../common/client';
import { downloadAttachmentActionOutputSchema } from '../output-schemas';

export const downloadAttachmentAction = createAction({
  auth: youtrackAuth,
  name: 'download_attachment',
  classification: 'READ',
  outputSchema: downloadAttachmentActionOutputSchema,
  displayName: 'Download Attachment',
  description: 'Downloads an attachment from an issue and returns it as a Base64-encoded string. Use this with the "Upload to Drive" or "Send Email" actions in your flow.',
  audience: 'both',
  aiMetadata: {
    description:
      'Download a single attachment from an issue and return its content as Base64 plus metadata, given the issue ID and attachment database ID (e.g. "134-31", found via List Attachments). The whole file is returned in the output, so prefer small files. Read-only and idempotent.',
    idempotent: true,
  },
  props: {
    issue: issueDropdown,
    attachmentId: Property.ShortText({
      displayName: 'Attachment ID',
      description: 'The attachment database ID (e.g. "134-31"). Use "List Attachments" to find it.',
      required: true,
    }),
  },
  async run(context) {
    const issueId = youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' });
    const attachmentId = youtrackClient.segment({ value: context.propsValue.attachmentId, label: 'Attachment ID' });
    const metaBody = await youtrackClient.request<unknown>({
      auth: context.auth,
      method: HttpMethod.GET,
      path: `/issues/${issueId}/attachments/${attachmentId}`,
      query: { fields: 'id,name,url,size,mimeType' },
      operation: 'read the attachment',
    });
    const meta = youtrackClient.recordOf(metaBody);
    const url = youtrackClient.optionalText(meta['url']) ?? `/api/issues/${issueId}/attachments/${attachmentId}/file`;
    const file = await youtrackClient.download({
      auth: context.auth,
      url,
      operation: 'download the attachment',
    });
    return {
      attachment_id: context.propsValue.attachmentId,
      file_name: youtrackClient.textOrNull(meta['name']),
      content_type: youtrackClient.optionalText(meta['mimeType']) ?? file.contentType ?? 'application/octet-stream',
      base64_content: file.data.toString('base64'),
      size_bytes: file.data.byteLength,
    };
  },
});
