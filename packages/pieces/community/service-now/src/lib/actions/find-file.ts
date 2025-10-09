import { createAction, Property } from '@activepieces/pieces-framework';
import { z } from 'zod';
import { AttachmentMetaSchema } from '../common/types';
import { serviceNowAuth, tableDropdown, recordDropdown, createServiceNowClient } from '../common/props';

const FindFileInputSchema = z.object({
  table: z.string().min(1),
  sys_id: z.string().min(1),
  filename: z.string().optional(),
});

export const findFileAction = createAction({
  name: 'find_file',
  displayName: 'Find File Attachments',
  description: 'Find file attachments for a ServiceNow record',
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
      displayName: 'Filename Filter',
      description: 'Optional filename to filter by (leave empty to get all attachments)',
      required: false,
    }),
  },
  async run(context) {
    const { table, record, manual_sys_id, filename } = context.propsValue;

    const recordId = record || manual_sys_id;
    if (!recordId) {
      throw new Error('Either record selection or manual sys_id must be provided');
    }
    
    const input = FindFileInputSchema.parse({ table, sys_id: recordId, filename });
    const client = createServiceNowClient(context.propsValue);

    const attachments = await client.listAttachments(input.table, input.sys_id);
    
    let filteredAttachments = attachments;
    if (input.filename) {
      filteredAttachments = attachments.filter(att => 
        att.file_name.toLowerCase().includes(input.filename!.toLowerCase())
      );
    }

    return filteredAttachments.map(attachment => AttachmentMetaSchema.parse(attachment));
  },
});