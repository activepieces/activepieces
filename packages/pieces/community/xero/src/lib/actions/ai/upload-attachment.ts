import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../../..';
import { XERO_URLS, XeroApiError, xeroApi, xeroInput } from '../../common/client';
import { aiInput, aiProps } from '../../common/ai-props';
import { MAX_ATTACHMENT_BYTES, xeroAttachments } from '../../common/attachments';
import { xeroOutputSchemas } from '../../output-schemas';

export const xeroUploadAttachmentAi = createAction({
  auth: xeroAuth,
  name: 'xero_upload_attachment_ai',
  classification: 'WRITE',
  displayName: 'Upload Attachment',
  description: 'Attaches a file to an existing invoice, bill, credit note, quote, purchase order, contact or other record.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Attaches a file (max 10 MB) to an existing Xero record given by resource type and record ID, such as an invoice, bill, credit note, purchase order, quote, contact, bank transaction or manual journal. Include Online only applies to sales invoices and credit notes. Attachments cannot be deleted through the API. Not idempotent: each call adds another attachment.',
    idempotent: false,
  },
  outputSchema: xeroOutputSchemas.attachment,
  props: {
    tenant_id: aiProps.tenantId(),
    resource_type: Property.StaticDropdown({
      displayName: 'Resource Type',
      required: true,
      options: {
        options: [
          { label: 'Invoice or bill', value: 'Invoices' },
          { label: 'Credit Note', value: 'CreditNotes' },
          { label: 'Purchase Order', value: 'PurchaseOrders' },
          { label: 'Quote', value: 'Quotes' },
          { label: 'Bank Transaction', value: 'BankTransactions' },
          { label: 'Bank Transfer', value: 'BankTransfers' },
          { label: 'Contact', value: 'Contacts' },
          { label: 'Account', value: 'Accounts' },
          { label: 'Manual Journal', value: 'ManualJournals' },
          { label: 'Repeating Invoice', value: 'RepeatingInvoices' },
        ],
      },
    }),
    resource_id: aiProps.id({ displayName: 'Record ID', description: 'Xero ID (a GUID) of the record, e.g. the InvoiceID.' }),
    file: Property.File({ displayName: 'File', description: 'The file to attach, up to 10 MB.', required: true }),
    file_name: Property.ShortText({ displayName: 'File Name', description: 'Defaults to the file\'s own name.', required: false }),
    include_online: Property.Checkbox({ displayName: 'Include Online', description: 'Show the attachment on the online invoice (sales invoices and credit notes only).', required: false, defaultValue: false }),
  },
  async run(context) {
    const values = context.propsValue;
    const resourceId = xeroInput.requiredText({ value: values.resource_id, field: 'Record ID' });
    const file = values.file;
    if (!Buffer.isBuffer(file.data)) throw new Error('File could not be read.');
    if (file.data.length > MAX_ATTACHMENT_BYTES) throw new Error('Xero accepts attachments up to 10 MB.');
    const fileName = xeroAttachments.sanitizeFileName({
      value: xeroInput.trimmedOrUndefined({ value: values.file_name }) ?? file.filename ?? `attachment${file.extension ? `.${file.extension}` : ''}`,
    });
    const includeOnline = values.include_online === true && (values.resource_type === 'Invoices' || values.resource_type === 'CreditNotes');
    const { accessToken, tenantId } = await aiInput.target({ accessToken: context.auth.access_token, tenantId: values.tenant_id });
    try {
      const body = await xeroApi.request<unknown>({
        accessToken,
        tenantId,
        method: HttpMethod.PUT,
        url: `${XERO_URLS.api}/${values.resource_type}/${encodeURIComponent(resourceId)}/Attachments/${encodeURIComponent(fileName)}`,
        queryParams: includeOnline ? { IncludeOnline: 'true' } : {},
        headers: { 'Content-Type': xeroAttachments.mimeTypeFor({ fileName, extension: file.extension }) },
        body: file.data,
        operation: 'upload attachment',
      });
      return xeroApi.firstRecord({ body, key: 'Attachments', operation: 'upload attachment' });
    } catch (error) {
      if (error instanceof XeroApiError && error.status === 404) {
        throw new Error(`No ${values.resource_type} record with ID ${resourceId} was found in this organisation.`);
      }
      throw error;
    }
  },
});
