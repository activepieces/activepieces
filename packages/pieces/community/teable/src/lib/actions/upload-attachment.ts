import { createAction, Property } from '@activepieces/pieces-framework';
import { TeableAuth } from '../auth';
import { TeableCommon } from '../common';
import { teableClient } from '../common/client';
import { teableOutputSchemas } from '../output-schemas';

export const uploadAttachmentAction = createAction({
  auth: TeableAuth,
  name: 'teable_upload_attachment',
  classification: 'WRITE',
  displayName: 'Upload Attachment',
  description: 'Uploads a file as an attachment to a field in a Teable record.',
  audience: 'both',
  aiMetadata: {
    description:
      'Attaches a file to an attachment field of an existing record. The File input accepts a URL or binary data. Each call adds another attachment, so a retry duplicates the file.',
    idempotent: false,
  },
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    record_id: TeableCommon.record_id,
    field_id: TeableCommon.attachment_field_id,
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload. Accepts a URL or a binary file.',
      required: true,
    }),
  },
  outputSchema: teableOutputSchemas.recordCore,
  async run(context) {
    const { table_id, record_id, field_id, file } = context.propsValue;
    return teableClient.uploadAttachment({
      auth: context.auth,
      tableId: table_id,
      recordId: record_id,
      fieldId: field_id,
      filename: file.filename,
      extension: file.extension,
      data: file.data,
    });
  },
});
