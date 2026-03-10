import { ApFile, createAction, Property } from '@activepieces/pieces-framework';
import { TeableAuth, TeableAuthValue } from '../auth';
import { makeClient, TeableCommon } from '../common';

export const uploadAttachmentAction = createAction({
  auth: TeableAuth,
  name: 'teable_upload_attachment',
  displayName: 'Upload Attachment',
  description: 'Uploads a file as an attachment to a field in a Teable record.',
  props: {
    base_id: TeableCommon.base_id,
    table_id: TeableCommon.table_id,
    record_id: TeableCommon.record_id,
    field_id: Property.Dropdown({
      auth: TeableAuth,
      displayName: 'Attachment Field',
      description: 'The attachment field to upload the file to.',
      required: true,
      refreshers: ['table_id'],
      options: async ({ auth, table_id }) => {
        if (!auth || !table_id) {
          return { disabled: true, options: [], placeholder: 'Select a table first.' };
        }
        const client = makeClient(auth as TeableAuthValue);
        const fields = await client.listFields(table_id as string);
        const attachmentFields = fields.filter((f) => f.type === 'attachment');
        return {
          disabled: false,
          options: attachmentFields.map((f) => ({ label: f.name, value: f.id })),
        };
      },
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload. Accepts a URL or a binary file.',
      required: true,
    }),
  },
  async run(context) {
    const { table_id, record_id, field_id } = context.propsValue;
    const client = makeClient(context.auth as TeableAuthValue);
    const file = context.propsValue.file as ApFile | string;

    const form = new FormData();
    if (typeof file === 'string' && /^https?:\/\//i.test(file)) {
      form.append('fileUrl', file);
    } else {
      const apFile = file as ApFile;
      const mimeType = apFile.extension
        ? `application/${apFile.extension.replace(/^\./, '')}`
        : 'application/octet-stream';
      form.append(
        'file',
        new Blob([new Uint8Array(apFile.data)], { type: mimeType }),
        apFile.filename
      );
    }

    return await client.uploadAttachment(table_id, record_id, field_id, form);
  },
});
