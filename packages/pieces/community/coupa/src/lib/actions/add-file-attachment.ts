import {
  DynamicPropsValue,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import FormData from 'form-data';
import { coupaAuth } from '../auth';
import { CoupaClient } from '../common/client';
import {
  attachmentModuleProperty,
  contractDropdown,
  purchaseOrderDropdown,
  supplierDropdown,
} from '../common/props';
import { CoupaModule, formatCoupaOutput } from '../common/utils';

export const addFileAttachment = createAction({
  auth: coupaAuth,
  name: 'add_file_attachment_to_object',
  displayName: 'Add File Attachment to Object',
  description:
    'Adds an attachment (an uploaded file or a link) to a Purchase Order, Supplier, or Contract in Coupa.',
  props: {
    module: attachmentModuleProperty,
    parentRecord: Property.DynamicProperties({
      displayName: 'Record',
      description: 'The record to attach to. Pick it by name after choosing a module.',
      required: true,
      refreshers: ['module'],
      auth: coupaAuth,
      props: async ({ module }): Promise<DynamicPropsValue> => {
        if (module === 'purchase_orders') {
          return { recordId: purchaseOrderDropdown };
        }
        if (module === 'suppliers') {
          return { recordId: supplierDropdown };
        }
        if (module === 'contracts') {
          return { recordId: contractDropdown };
        }
        return {
          recordId: Property.ShortText({
            displayName: 'Record ID',
            description: 'Select a module first.',
            required: true,
          }),
        };
      },
    }),
    attachmentSource: Property.StaticDropdown({
      displayName: 'Attachment Type',
      description:
        'Choose whether to upload a file directly or attach a link (URL).',
      required: true,
      defaultValue: 'file',
      options: {
        disabled: false,
        options: [
          { label: 'Upload a file', value: 'file' },
          { label: 'Link a URL', value: 'url' },
        ],
      },
    }),
    attachment: Property.DynamicProperties({
      displayName: 'Attachment',
      description: 'The file to upload or the URL to link.',
      required: true,
      refreshers: ['attachmentSource'],
      auth: coupaAuth,
      props: async ({ attachmentSource }): Promise<DynamicPropsValue> => {
        if (attachmentSource === 'url') {
          return {
            url: Property.ShortText({
              displayName: 'URL',
              description: 'The full link to attach (e.g. https://example.com/spec.pdf).',
              required: true,
            }),
          };
        }
        return {
          file: Property.File({
            displayName: 'File',
            description: 'The file to upload to the record.',
            required: true,
          }),
        };
      },
    }),
    intent: Property.ShortText({
      displayName: 'Intent',
      description:
        'Optional Coupa attachment intent that controls who can see the attachment (e.g. `Supplier`). Leave empty to use the Coupa default.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const client = new CoupaClient(auth.props);
    const module = propsValue.module as CoupaModule;
    const parentId = (propsValue.parentRecord as { recordId: string }).recordId;
    const source = propsValue.attachmentSource as string;
    const attachment = propsValue.attachment as {
      file?: { data: Buffer; filename: string; extension?: string };
      url?: string;
    };

    const formData = new FormData();
    if (source === 'url') {
      formData.append('attachment[url]', attachment.url ?? '');
      formData.append('attachment[type]', 'url');
    } else {
      const file = attachment.file;
      if (!file) {
        throw new Error('A file is required when the attachment type is "Upload a file".');
      }
      const MIME_MAP: Record<string, string> = {
        pdf: 'application/pdf',
        doc: 'application/msword',
        docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        xls: 'application/vnd.ms-excel',
        xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        csv: 'text/csv',
        txt: 'text/plain',
        xml: 'application/xml',
        zip: 'application/zip',
      };
      const ext = (file.extension ?? '').toLowerCase();
      const contentType = MIME_MAP[ext] ?? (ext ? `application/${ext}` : undefined);
      formData.append('attachment[file]', file.data, {
        filename: file.filename,
        contentType,
      });
      formData.append('attachment[type]', 'file');
    }
    if (propsValue.intent) {
      formData.append('attachment[intent]', propsValue.intent);
    }

    const result = await client.requestMultipart<Record<string, unknown>>({
      resourceUri: `/${module}/${parentId}/attachments`,
      formData,
    });
    return formatCoupaOutput(result, module);
  },
});
