import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { AttachmentMetaSchema } from '../common/types';
import {
  tableDropdown,
  recordDropdown,
  createServiceNowClient,
  servicenowAuth,
} from '../common/props';

const AttachFileInputSchema = z
  .object({
    table_name: z.string().min(1),
    table_sys_id: z.string().min(1),
    file_name: z.string().min(1),
    content_type: z.string().min(1),
    fileBase64: z.string().optional(),
    filePath: z.string().optional(),
    encryption_context: z.string().optional(),
  })
  .refine((data) => data.fileBase64 || data.filePath, {
    message: 'Either fileBase64 or filePath must be provided',
  });

export const attachFileToRecordAction = createAction({
  name: 'attach_file_to_record',
  displayName: 'Attach File to Record',
  description: 'Upload and attach a file to a record',
  auth: servicenowAuth,
  props: {
    table: tableDropdown,
    record: recordDropdown,
    manual_sys_id: Property.ShortText({
      displayName: 'Or Enter Sys ID Manually',
      description: 'Enter the sys_id directly if not found in dropdown',
      required: false,
    }),
    file_name: Property.ShortText({
      displayName: 'File Name',
      description: 'Name for the attachment',
      required: true,
    }),
    content_type: Property.StaticDropdown({
      displayName: 'Content Type',
      description: 'File content type',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'PDF Document', value: 'application/pdf' },
          {
            label: 'Word Document (.docx)',
            value:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
          { label: 'Word Document (.doc)', value: 'application/msword' },
          {
            label: 'Excel Spreadsheet (.xlsx)',
            value:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
          {
            label: 'Excel Spreadsheet (.xls)',
            value: 'application/vnd.ms-excel',
          },
          {
            label: 'PowerPoint (.pptx)',
            value:
              'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          },
          {
            label: 'PowerPoint (.ppt)',
            value: 'application/vnd.ms-powerpoint',
          },
          { label: 'Text File', value: 'text/plain' },
          { label: 'CSV File', value: 'text/csv' },
          { label: 'JSON File', value: 'application/json' },
          { label: 'XML File', value: 'application/xml' },
          { label: 'ZIP Archive', value: 'application/zip' },
          { label: 'PNG Image', value: 'image/png' },
          { label: 'JPEG Image', value: 'image/jpeg' },
          { label: 'GIF Image', value: 'image/gif' },
          { label: 'SVG Image', value: 'image/svg+xml' },
          { label: 'BMP Image', value: 'image/bmp' },
          { label: 'TIFF Image', value: 'image/tiff' },
          { label: 'Any File Type', value: '*/*' },
          { label: 'Binary/Other', value: 'application/octet-stream' },
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
      description: 'Path to file on local system (use this OR base64)',
      required: false,
    }),
    encryption_context: Property.ShortText({
      displayName: 'Encryption Context',
      description: 'Encryption context sys_id to restrict file access',
      required: false,
    }),
  },
  async run(context) {
    const {
      table,
      record,
      manual_sys_id,
      file_name,
      content_type,
      fileBase64,
      filePath,
      encryption_context,
    } = context.propsValue;

    const recordId = record || manual_sys_id;
    if (!recordId) {
      throw new Error(
        'Either record selection or manual sys_id must be provided'
      );
    }

    const input = AttachFileInputSchema.parse({
      table_name: table,
      table_sys_id: recordId,
      file_name,
      content_type,
      fileBase64,
      filePath,
      encryption_context,
    });

    const client = createServiceNowClient(context.auth);

    const result = await client.attachFile(
      input.table_name,
      input.table_sys_id,
      input.file_name,
      input.content_type,
      input.filePath,
      input.fileBase64,
      input.encryption_context
    );

    return AttachmentMetaSchema.parse(result);
  },
});
