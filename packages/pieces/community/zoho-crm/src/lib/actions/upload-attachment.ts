import { Property, createAction } from '@activepieces/pieces-framework';
import { zohoCrmAuth } from '../auth';
import { requireApiName, requireId } from '../common/client';
import { moduleDropdown, recordDropdown } from '../common/props';
import { readApFile, uploadAttachment } from '../common/records';
import { childWriteOutputSchema } from '../output-schemas';

export const uploadAttachmentAction = createAction({
  auth: zohoCrmAuth,
  name: 'upload_attachment',
  classification: 'WRITE',
  displayName: 'Upload Attachment',
  description: 'Attaches a file to a record.',
  audience: 'human',
  aiMetadata: {
    description:
      'Uploads a file from the flow as an attachment on one Zoho CRM record in any module. Use when you hold file bytes from an earlier step. Not idempotent: each call adds another attachment.',
    idempotent: false,
  },
  props: {
    module: moduleDropdown(),
    record_id: recordDropdown(),
    file: Property.File({ displayName: 'File', required: true }),
    file_name: Property.ShortText({ displayName: 'File Name', description: 'Optional. Overrides the file name.', required: false }),
  },
  outputSchema: childWriteOutputSchema,
  async run({ auth, propsValue }) {
    const file = readApFile(propsValue.file);
    return uploadAttachment({
      auth,
      module: requireApiName({ value: propsValue.module, name: 'Module' }),
      recordId: requireId({ value: propsValue.record_id, name: 'Record' }),
      file: { filename: propsValue.file_name || file.filename, data: file.data },
    });
  },
});
