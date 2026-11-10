import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';
import { xeroAttachments } from '../common/attachments';
import { xeroOutputSchemas } from '../output-schemas';

type ResourceType =
  | 'Invoices'
  | 'CreditNotes'
  | 'PurchaseOrders'
  | 'Quotes'
  | 'BankTransfers'
  | 'BankTransactions'
  | 'Contacts'
  | 'Accounts'
  | 'ManualJournals'
  | 'Receipts'
  | 'RepeatingInvoices';

export const xeroUploadAttachment = createAction({
  auth: xeroAuth,
  name: 'xero_upload_attachment',
  classification: 'WRITE',
  displayName: 'Upload Attachment',
  description: 'Uploads an attachment to a specific Xero resource.',
  audience: 'human',
  aiMetadata: {
    description:
      'Attach a file (max 10MB) to an existing Xero record such as an invoice, bill, credit note, purchase order, quote, contact, or bank transaction, selected by resource type and ID. Pick this to add supporting documents (receipts, PDFs) to an already-created record, not to create the record itself. Not idempotent: it appends a new attachment per call; IncludeOnline only applies to ACCREC invoices and credit notes.',
    idempotent: false,
  },
  outputSchema: xeroOutputSchemas.attachmentEnvelope,
  props: {
    tenant_id: props.tenant_id,
    resource_type: Property.StaticDropdown({
      displayName: 'Resource Type',
      description:
        'The Xero resource to attach the file to. Receipt works only on connections created before version 0.8.0.',
      required: true,
      options: {
        options: [
          { label: 'Invoice', value: 'Invoices' },
          { label: 'Credit Note', value: 'CreditNotes' },
          { label: 'Purchase Order', value: 'PurchaseOrders' },
          { label: 'Quote', value: 'Quotes' },
          { label: 'Bank Transfer', value: 'BankTransfers' },
          { label: 'Bank Transaction', value: 'BankTransactions' },
          { label: 'Contact', value: 'Contacts' },
          { label: 'Account', value: 'Accounts' },
          { label: 'Manual Journal', value: 'ManualJournals' },
          { label: 'Receipt (connections created before 0.8.0 only)', value: 'Receipts' },
          { label: 'Repeating Invoice', value: 'RepeatingInvoices' },
        ],
      },
    }),
    resource_id: Property.Dropdown({
      auth: xeroAuth,
      displayName: 'Resource',
      description: 'Select the specific resource to attach the file to.',
      required: true,
      refreshers: ['tenant_id', 'resource_type'],
      options: async ({ auth, propsValue, tenant_id, resource_type }) => {
        const rawTenant = tenant_id ?? (propsValue as Record<string, any>)?.['tenant_id'];
        const tenantId: string | undefined =
          typeof rawTenant === 'string'
            ? rawTenant
            : rawTenant?.value || rawTenant?.tenantId || rawTenant?.id;
        const rawResourceType = resource_type ?? (propsValue as Record<string, any>)?.['resource_type'];
        const resourceType = (typeof rawResourceType === 'string' ? rawResourceType : rawResourceType?.value) as ResourceType | undefined;

        if (!auth)
          return {
            disabled: true,
            options: [],
            placeholder: 'Please authenticate first',
          };
        if (!tenantId)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select an Organization first',
          };
        if (!resourceType)
          return {
            disabled: true,
            options: [],
            placeholder: 'Select a Resource Type',
          };

        const endpointMap: Record<ResourceType, { url: string; arrayKey: string; idKey: string; label: (item: any) => string }> = {
          Invoices: {
            url: 'https://api.xero.com/api.xro/2.0/Invoices?summaryOnly=true&page=1',
            arrayKey: 'Invoices',
            idKey: 'InvoiceID',
            label: (inv) => [inv.InvoiceNumber || inv.InvoiceID, inv.Contact?.Name, inv.Status].filter(Boolean).join(' • '),
          },
          CreditNotes: {
            url: 'https://api.xero.com/api.xro/2.0/CreditNotes',
            arrayKey: 'CreditNotes',
            idKey: 'CreditNoteID',
            label: (cn) => [cn.CreditNoteNumber || cn.CreditNoteID, cn.Contact?.Name, cn.Type, cn.Status].filter(Boolean).join(' • '),
          },
          PurchaseOrders: {
            url: 'https://api.xero.com/api.xro/2.0/PurchaseOrders?page=1',
            arrayKey: 'PurchaseOrders',
            idKey: 'PurchaseOrderID',
            label: (po) => [po.PurchaseOrderNumber || po.PurchaseOrderID, po.Contact?.Name, po.Status].filter(Boolean).join(' • '),
          },
          Quotes: {
            url: 'https://api.xero.com/api.xro/2.0/Quotes?page=1',
            arrayKey: 'Quotes',
            idKey: 'QuoteID',
            label: (q) => [q.QuoteNumber || q.QuoteID, q.Contact?.Name, q.Status].filter(Boolean).join(' • '),
          },
          BankTransfers: {
            url: 'https://api.xero.com/api.xro/2.0/BankTransfers',
            arrayKey: 'BankTransfers',
            idKey: 'BankTransferID',
            label: (bt) => [bt.BankTransferID, bt.Amount ? `Amount ${bt.Amount}` : undefined].filter(Boolean).join(' • '),
          },
          BankTransactions: {
            url: 'https://api.xero.com/api.xro/2.0/BankTransactions?page=1',
            arrayKey: 'BankTransactions',
            idKey: 'BankTransactionID',
            label: (bt) => [bt.Type, bt.BankTransactionID, bt.Contact?.Name, bt.Amount].filter(Boolean).join(' • '),
          },
          Contacts: {
            url: 'https://api.xero.com/api.xro/2.0/Contacts?summaryOnly=true&page=1',
            arrayKey: 'Contacts',
            idKey: 'ContactID',
            label: (c) => [c.Name, c.EmailAddress].filter(Boolean).join(' • '),
          },
          Accounts: {
            url: 'https://api.xero.com/api.xro/2.0/Accounts',
            arrayKey: 'Accounts',
            idKey: 'AccountID',
            label: (a) => [a.Name || a.Code || a.AccountID, a.Code].filter(Boolean).join(' • '),
          },
          ManualJournals: {
            url: 'https://api.xero.com/api.xro/2.0/ManualJournals?page=1',
            arrayKey: 'ManualJournals',
            idKey: 'ManualJournalID',
            label: (mj) => [mj.ManualJournalID, mj.Date].filter(Boolean).join(' • '),
          },
          Receipts: {
            url: 'https://api.xero.com/api.xro/2.0/Receipts?page=1',
            arrayKey: 'Receipts',
            idKey: 'ReceiptID',
            label: (r) => [r.ReceiptID, r.Date, r.Total].filter(Boolean).join(' • '),
          },
          RepeatingInvoices: {
            url: 'https://api.xero.com/api.xro/2.0/RepeatingInvoices?page=1',
            arrayKey: 'RepeatingInvoices',
            idKey: 'RepeatingInvoiceID',
            label: (ri) => [ri.RepeatingInvoiceID, ri.Status].filter(Boolean).join(' • '),
          },
        };

        const cfg = endpointMap[resourceType as ResourceType];
        const request: HttpRequest = {
          method: HttpMethod.GET,
          url: cfg.url,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (auth as any).access_token,
          },
          headers: {
            'Xero-Tenant-Id': tenantId,
          },
        };

        let result;
        try {
          result = await httpClient.sendRequest<Record<string, unknown[] | undefined>>(request);
        } catch (error) {
          if (resourceType === 'Receipts' && isMissingPermissionError({ error })) {
            return {
              disabled: true,
              options: [],
              placeholder: RECEIPTS_SCOPE_MESSAGE,
            };
          }
          throw error;
        }
        if (result.status === 200) {
          const items: any[] = result.body?.[cfg.arrayKey] ?? [];
          const options = items.slice(0, 100).map((item) => ({
            label: cfg.label(item),
            value: item[cfg.idKey],
          }));
          return { disabled: false, options };
        }

        return {
          disabled: true,
          options: [],
          placeholder: 'Unable to load resources',
        };
      },
    }),
    file: Property.File({
      displayName: 'File',
      description: 'The file to upload. Max 10MB per Xero limits.',
      required: true,
    }),
    file_name: Property.ShortText({
      displayName: 'File Name (override)',
      description: 'Optional file name to use in Xero. Avoid characters: < > : " / \\ | ? *',
      required: false,
    }),
    content_type: Property.ShortText({
      displayName: 'Content Type',
      description: 'MIME type of the file (e.g., image/png). If not set, will be inferred or default to application/octet-stream.',
      required: false,
    }),
    include_online: Property.Checkbox({
      displayName: 'Include with Online Invoice',
      description: 'Only applicable to ACCREC invoices and ACCREC credit notes. Adds IncludeOnline=true query parameter.',
      required: false,
      defaultValue: false,
    }),
  },
  async run(context) {
    const { tenant_id, resource_type, resource_id, file, file_name, content_type, include_online } =
      context.propsValue as {
        tenant_id: string;
        resource_type: ResourceType;
        resource_id: string;
        file: { data: any; filename?: string; extension?: string };
        file_name?: string;
        content_type?: string;
        include_online?: boolean;
      };

    const endpoint = resource_type as string;
    const chosenFileName = file_name || file.filename || `attachment${file.extension ? '.' + file.extension : ''}`;
    const inferredContentType = content_type || xeroAttachments.mimeTypeFor({ fileName: chosenFileName, extension: file.extension });

    const includeOnlineAllowed = resource_type === 'Invoices' || resource_type === 'CreditNotes';
    const query = include_online && includeOnlineAllowed ? '?IncludeOnline=true' : '';
    const encodedFileName = encodeURIComponent(chosenFileName);
    const url = `https://api.xero.com/api.xro/2.0/${endpoint}/${resource_id}/Attachments/${encodedFileName}${query}`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      body: file.data,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as any).access_token,
      },
      headers: {
        'Xero-Tenant-Id': tenant_id,
        'Content-Type': inferredContentType,
        Accept: 'application/json',
      },
    };

    let result;
    try {
      result = await httpClient.sendRequest(request);
    } catch (error) {
      if (resource_type === 'Receipts' && isMissingPermissionError({ error })) {
        throw new Error(RECEIPTS_SCOPE_MESSAGE);
      }
      throw error;
    }
    if (result.status === 200) {
      return result.body;
    }
    return result;
  },
});

const RECEIPTS_SCOPE_MESSAGE =
  'Xero refused access to Receipts (HTTP 401/403). Receipts need the accounting.classicexpenses permission, which Xero no longer grants to new connections. Only Xero connections created before Xero piece version 0.8.0 can attach files to Receipts; choose another resource type.';

function isMissingPermissionError({ error }: { error: unknown }) {
  return error instanceof HttpError && (error.response.status === 401 || error.response.status === 403);
}


