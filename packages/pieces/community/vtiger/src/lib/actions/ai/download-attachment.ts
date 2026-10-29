import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { vtigerAuth } from '../../auth';
import { downloadAttachmentSchema } from '../../output-schemas';
import { isRecord, vtigerRest } from '../../rest-client';

export function assertAttachmentId(value: unknown): string {
  const id = typeof value === 'string' ? value.trim() : '';
  if (!/^[0-9]+(x[0-9]+)?(_[0-9]+)?$/.test(id)) {
    throw new Error(
      `Attachment ID "${String(value ?? '')}" is not valid. Use a value from the record's imageattachmentids field.`
    );
  }
  return id;
}

export function pickAttachment(result: unknown): Record<string, unknown> {
  const item = Array.isArray(result) ? result.find(isRecord) : result;
  if (!isRecord(item) || typeof item['filecontents'] !== 'string') {
    throw new Error('Vtiger returned no file contents for this attachment ID');
  }
  return item;
}

export const downloadAttachmentAction = createAction({
  auth: vtigerAuth,
  name: 'download_attachment',
  displayName: 'Download Attachment',
  description: 'Downloads an image attachment of a Vtiger record as a file.',
  classification: 'READ',
  audience: 'ai',
  aiMetadata: {
    description:
      "Downloads one attachment (e.g. a contact photo or product image) and returns it as a file. The input is an attachment ID taken from a record's imageattachmentids field (Get Record by ID), not the record ID.",
    idempotent: true,
  },
  outputSchema: downloadAttachmentSchema,
  props: {
    attachmentId: Property.ShortText({
      displayName: 'Attachment ID',
      description: "Value from the record's imageattachmentids field.",
      required: true,
    }),
  },
  async run({ auth, propsValue, files }) {
    const id = assertAttachmentId(propsValue.attachmentId);
    const result = await vtigerRest<unknown>({
      creds: auth.props,
      method: HttpMethod.GET,
      path: 'files_retrieve',
      query: { id },
    });
    const item = pickAttachment(result);
    const contents = String(item['filecontents']);
    if (contents.length > MAX_BASE64_LENGTH) {
      throw new Error('The attachment is larger than 25 MB and cannot be downloaded by this action');
    }
    const data = Buffer.from(contents, 'base64');
    const fileName = typeof item['filename'] === 'string' && item['filename'] !== '' ? item['filename'] : `attachment-${id}`;
    const file = await files.write({ fileName, data });
    return {
      attachmentId: id,
      fileName,
      fileType: typeof item['filetype'] === 'string' ? item['filetype'] : '',
      fileSize: data.length,
      file,
    };
  },
});

const MAX_BASE64_LENGTH = Math.ceil((25 * 1024 * 1024 * 4) / 3);
