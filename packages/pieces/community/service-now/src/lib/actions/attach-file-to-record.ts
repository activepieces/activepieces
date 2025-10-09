import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { AttachmentMetaSchema } from '../common/types';
import { serviceNowAuth, tableDropdown, recordDropdown, createServiceNowClient } from '../common/props';

const AttachFileInputSchema = z.object({
  table: z.string().min(1),
  sys_id: z.string().min(1),
  filename: z.string().min(1),
  contentType: z.string().min(1),
  fileBase64: z.string().optional(),
  filePath: z.string().optional(),
}).refine(data => data.fileBase64 || data.filePath, {
  message: 'Either fileBase64 or filePath must be provided',
});

export const attachFileToRecordAction = createAction({
  name: 'attach_file_to_record',
  displayName: 'Attach File to Record',
  description: 'Attach a file to a ServiceNow record',
  props: {
    ...serviceNowAuth,
    table: tableDropdown,
    record: recordDropdown,
    manual_sys_id: Property.ShortText({
      displayName: 'Or Enter Sys ID Manually',
      description: 'Enter the sys_id directly if not found in dropdown',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'Name of the file to attach',
      required: true,
    }),
    contentType: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'MIME type of the file',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'PDF Document', value: 'application/pdf' },
          { label: 'Word Document', value: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
          { label: 'Excel Spreadsheet', value: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
          { label: 'PowerPoint Presentation', value: 'application/vnd.openxmlformats-officedocument.presentationml.presentation' },
          { label: 'Text File', value: 'text/plain' },
          { label: 'CSV File', value: 'text/csv' },
          { label: 'JSON File', value: 'application/json' },
          { label: 'XML File', value: 'application/xml' },
          { label: 'ZIP Archive', value: 'application/zip' },
          { label: 'PNG Image', value: 'image/png' },
          { label: 'JPEG Image', value: 'image/jpeg' },
          { label: 'GIF Image', value: 'image/gif' },
          { label: 'SVG Image', value: 'image/svg+xml' },
          { label: 'Other', value: 'application/octet-stream' },
        ],
      },
    }),
    fileBase64: Property.LongText({
      displayName: 'File Base64',
      description: 'Base64 encoded file content (use this OR file path)',
      required: false,
    }),
    filePath: Property.ShortText({
      displayName: 'File Path',
      description: 'Path to the file on the local system (use this OR base64)',
      required: false,
    }),
  },
  async run(context) {
    const { table, record, manual_sys_id, filename, contentType, fileBase64, filePath } = context.propsValue;

    const recordId = record || manual_sys_id;
    if (!recordId) {
      throw new Error('Either record selection or manual sys_id must be provided');
    }
    
    const input = AttachFileInputSchema.parse({ table, sys_id: recordId, filename, contentType, fileBase64, filePath });
    const client = createServiceNowClient(context.propsValue);

    const result = await client.attachFile(
      input.table,
      input.sys_id,
      input.filePath,
      input.fileBase64,
      input.filename,
      input.contentType
    );

    return AttachmentMetaSchema.parse(result);
  },
});