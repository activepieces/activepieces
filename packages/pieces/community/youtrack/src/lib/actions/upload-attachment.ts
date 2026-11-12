import { randomUUID } from 'node:crypto';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { youtrackAuth } from '../auth';
import { issueDropdown } from '../common';
import { YoutrackApiError, youtrackClient } from '../common/client';
import { uploadAttachmentActionOutputSchema } from '../output-schemas';

function asciiFileName(name: string): string {
  const ascii = name.replace(/[\r\n]/g, '').replace(/["\\]/g, '_').replace(/[^\x20-\x7e]/g, '_');
  return ascii === '' ? 'file' : ascii;
}

function encodeRfc5987(name: string): string {
  return encodeURIComponent(name.replace(/[\r\n]/g, '')).replace(/['()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase());
}

function fileBytes(value: unknown): Buffer | undefined {
  if (value === null || typeof value !== 'object') return undefined;
  const data = Reflect.get(value, 'data');
  if (Buffer.isBuffer(data)) return data;
  const base64 = Reflect.get(value, 'base64');
  if (typeof base64 === 'string' && base64 !== '') return Buffer.from(base64, 'base64');
  return undefined;
}

export const uploadAttachmentAction = createAction({
  auth: youtrackAuth,
  name: 'upload_attachment',
  classification: 'WRITE',
  outputSchema: uploadAttachmentActionOutputSchema,
  displayName: 'Upload Attachment',
  description: 'Uploads one or more files as attachments to an existing issue.',
  audience: 'both',
  aiMetadata: {
    description:
      'Attach one or more files to an existing issue, given the issue ID plus a file name and file for each entry; the file can be a URL, a file from an earlier step, or a base64 data URL (data:<type>;base64,...). Use to add screenshots, logs, or documents to an issue. Not idempotent: each call appends new attachments.',
    idempotent: false,
  },
  props: {
    issue: issueDropdown,
    files: Property.Array({
      displayName: 'Files',
      description: 'Add files to attach. Each needs a file name and a file.',
      required: true,
      properties: {
        fileName: Property.ShortText({
          displayName: 'File Name',
          description: 'The name the file will have in YouTrack (e.g. "screenshot.png").',
          required: true,
        }),
        fileContent: Property.File({
          displayName: 'File Content (Base64)',
          description: 'The file: a URL, a file from an earlier step, or a base64 data URL (data:<type>;base64,...).',
          required: true,
        }),
      },
    }),
  },
  async run(context) {
    const issueId = youtrackClient.segment({ value: context.propsValue.issue, label: 'Issue' });
    const entries = Array.isArray(context.propsValue.files) ? context.propsValue.files : [];
    const results: Array<{ id: unknown; name: unknown }> = [];
    for (const [index, entry] of entries.entries()) {
      const record = youtrackClient.recordOf(entry);
      const fileName = youtrackClient.optionalText(record['fileName']);
      if (fileName === undefined) {
        throw new Error(`File ${index + 1} has no File Name.`);
      }
      const data = fileBytes(record['fileContent']);
      if (data === undefined) {
        throw new Error(`File ${index + 1} ("${fileName}") has no content. Pass a URL, a file from an earlier step, or a base64 data URL.`);
      }
      const boundary = '----ActivepiecesBoundary' + randomUUID().replace(/-/g, '');
      const storedName = fileName.replace(/\\/g, '_');
      const safeName = asciiFileName(storedName);
      const body = Buffer.concat([
        Buffer.from(
          '--' + boundary + '\r\n' +
          'Content-Disposition: form-data; name="upload"; filename="' + safeName + '"; filename*=UTF-8\'\'' + encodeRfc5987(storedName) + '\r\n' +
          'Content-Type: application/octet-stream\r\n\r\n',
          'utf-8',
        ),
        data,
        Buffer.from('\r\n--' + boundary + '--\r\n', 'utf-8'),
      ]);
      try {
        const response = await youtrackClient.request<unknown>({
          auth: context.auth,
          method: HttpMethod.POST,
          path: `/issues/${issueId}/attachments`,
          query: { fields: 'id,name' },
          headers: { 'Content-Type': 'multipart/form-data; boundary=' + boundary },
          body,
          timeoutMs: youtrackClient.TRANSFER_TIMEOUT_MS,
          operation: `upload "${safeName.slice(0, 80)}"`,
        });
        results.push(...youtrackClient.records(response).map((a) => ({ id: a['id'], name: a['name'] })));
      } catch (error) {
        if (results.length === 0) throw error;
        const uploaded = results.map((r) => String(r.name)).join(', ');
        const reason = error instanceof Error ? error.message : String(error);
        const message = `${reason} Already attached before this failure: ${uploaded}.`;
        if (error instanceof YoutrackApiError) {
          throw new YoutrackApiError({ message, status: error.status, responseBody: error.responseBody });
        }
        throw new Error(message);
      }
    }
    return results;
  },
});
