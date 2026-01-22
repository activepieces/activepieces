import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { AttachmentMetaSchema } from '../common/types';
import {
  tableDropdown,
  recordDropdown,
  createServiceNowClient,
  servicenowAuth,
} from '../common/props';

const FindFileInputSchema = z
  .object({
    action_type: z.enum(['list', 'download']),
    table: z.string().min(1).optional(),
    sys_id: z.string().min(1).optional(),
    filename: z.string().optional(),
    attachment_sys_id: z.string().min(1).optional(),
    accept_type: z.string().optional(),
    return_format: z.enum(['base64', 'buffer', 'metadata']).optional(),
  })
  .refine(
    (data) => {
      if (data.action_type === 'list') {
        return data.table && data.sys_id;
      } else if (data.action_type === 'download') {
        return data.attachment_sys_id;
      }
      return false;
    },
    {
      message:
        'For list action: table and sys_id are required. For download action: attachment_sys_id is required.',
    }
  );

export const findFileAction = createAction({
  name: 'find_file',
  displayName: 'Find File',
  auth: servicenowAuth,
  description: 'List or download file attachments from a record',
  props: {
    action_type: Property.StaticDropdown({
      displayName: 'Action Type',
      description: 'List attachments or download a file',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'List Attachments', value: 'list' },
          { label: 'Download File', value: 'download' },
        ],
      },
    }),
    table: tableDropdown,
    record: recordDropdown,
    manual_sys_id: Property.ShortText({
      displayName: 'Or Enter Record Sys ID Manually',
      description: 'Record sys_id (for listing attachments)',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'Filename Filter',
      description: 'Filter attachments by filename (optional)',
      required: false,
    }),
    attachment_sys_id: Property.ShortText({
      displayName: 'Attachment Sys ID',
      description: 'Attachment sys_id to download',
      required: false,
    }),
    accept_type: Property.StaticDropdown({
      displayName: 'Accept Type',
      description: 'File type to accept when downloading',
      required: false,
      defaultValue: '*/*',
      options: {
        disabled: false,
        options: [
          { label: 'Any file type (*/*)', value: '*/*' },
          { label: 'Any image (image/*)', value: 'image/*' },
          { label: 'JPEG Image', value: 'image/jpeg' },
          { label: 'PNG Image', value: 'image/png' },
          { label: 'GIF Image', value: 'image/gif' },
          { label: 'SVG Image', value: 'image/svg+xml' },
          { label: 'PDF Document', value: 'application/pdf' },
          {
            label: 'Word Document',
            value:
              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
          {
            label: 'Excel Spreadsheet',
            value:
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          },
          { label: 'Text File', value: 'text/plain' },
          { label: 'JSON File', value: 'application/json' },
          { label: 'ZIP Archive', value: 'application/zip' },
        ],
      },
    }),
    return_format: Property.StaticDropdown({
      displayName: 'Return Format',
      description: 'Format for returned file data',
      required: false,
      defaultValue: 'base64',
      options: {
        disabled: false,
        options: [
          { label: 'Base64 encoded string', value: 'base64' },
          { label: 'Buffer object', value: 'buffer' },
          { label: 'File metadata only', value: 'metadata' },
        ],
      },
    }),
  },
  async run(context) {
    const {
      action_type,
      table,
      record,
      manual_sys_id,
      filename,
      attachment_sys_id,
      accept_type,
      return_format,
    } = context.propsValue;

    const client = createServiceNowClient(context.auth);

    if (action_type === 'list') {
      const recordId = record || manual_sys_id;
      if (!recordId || !table) {
        throw new Error(
          'Table and record selection are required for listing attachments'
        );
      }

      const input = FindFileInputSchema.parse({
        action_type,
        table,
        sys_id: recordId,
        filename,
      });

      const attachments = await client.listAttachments(
        input.table!,
        input.sys_id!
      );

      let filteredAttachments = attachments;
      if (input.filename) {
        filteredAttachments = attachments.filter((att) =>
          att.file_name.toLowerCase().includes(input.filename!.toLowerCase())
        );
      }

      return {
        action: 'list',
        attachments: filteredAttachments.map((attachment) =>
          AttachmentMetaSchema.parse(attachment)
        ),
        count: filteredAttachments.length,
      };
    } else if (action_type === 'download') {
      if (!attachment_sys_id) {
        throw new Error('Attachment sys_id is required for downloading files');
      }

      const input = FindFileInputSchema.parse({
        action_type,
        attachment_sys_id,
        accept_type: accept_type || '*/*',
        return_format: return_format || 'base64',
      });

      const result = await client.getAttachment(
        input.attachment_sys_id!,
        input.accept_type
      );

      switch (input.return_format) {
        case 'base64':
          return {
            action: 'download',
            file_data: result.data.toString('base64'),
            metadata: result.metadata,
            size_bytes: result.data.length,
            format: 'base64',
          };
        case 'buffer':
          return {
            action: 'download',
            file_data: result.data,
            metadata: result.metadata,
            size_bytes: result.data.length,
            format: 'buffer',
          };
        case 'metadata':
          return {
            action: 'download',
            metadata: result.metadata,
            size_bytes: result.data.length,
            format: 'metadata_only',
          };
        default:
          return {
            action: 'download',
            file_data: result.data.toString('base64'),
            metadata: result.metadata,
            size_bytes: result.data.length,
            format: 'base64',
          };
      }
    }

    throw new Error('Invalid action type');
  },
});
