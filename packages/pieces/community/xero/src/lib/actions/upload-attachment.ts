import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';

export const uploadAttachment = createAction({
  auth: xeroAuth,
  name: 'uploadAttachment',
  displayName: 'Upload Attachment',
  description: 'Uploads an attachment to a specific Xero resource',
  props: {
    tenant_id: Property.ShortText({
      displayName: 'Tenant ID',
      description: 'The ID of the Xero tenant',
      required: true,
    }),
    resourceType: Property.StaticDropdown({
      displayName: 'Resource Type',
      description:
        'The type of resource to attach the file to (e.g., Invoice, Credit Note)',
      required: true,
      options: {
        options: [
          { label: 'Invoice', value: 'Invoices' },
          { label: 'Credit Note', value: 'CreditNotes' },
          { label: 'Purchase Order', value: 'PurchaseOrders' },
          { label: 'Contact', value: 'Contacts' },
        ],
      },
    }),
    resourceId: Property.ShortText({
      displayName: 'Resource ID',
      description: 'The ID of the resource to attach the file to',
      required: true,
    }),
    fileName: Property.ShortText({
      displayName: 'File Name',
      description: 'The name of the file to upload (e.g., attachment.pdf)',
      required: true,
    }),
    fileContent: Property.File({
      displayName: 'File Content',
      description: 'The content of the file to upload',
      required: true,
    }),
    mimeType: Property.ShortText({
      displayName: 'MIME Type',
      description: 'The MIME type of the file (e.g., application/pdf)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      tenant_id,
      resourceType,
      resourceId,
      fileName,
      fileContent,
      mimeType,
    } = propsValue;

    // Validate inputs
    if (!fileContent || !fileName || !mimeType) {
      throw new Error('File content, file name, and MIME type are required.');
    }

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.PUT,
      `/${resourceType}/${resourceId}/Attachments/${fileName}`,
      fileContent,
      {
        'Xero-Tenant-Id': tenant_id,
        'Content-Type': mimeType,
      }
    );

    return response;
  },
});
