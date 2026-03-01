import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroUpdateSalesInvoice = createAction({
  auth: xeroAuth,
  name: 'xero_update_sales_invoice',
  displayName: 'Update Sales Invoice',
  description: 'Updates details of an existing sales invoice (ACCREC).',
  props: {
    tenant_id: props.tenant_id,
    allow_authorised: Property.Checkbox({
      displayName: 'Allow AUTHORISED invoices',
      description:
        'Enable updates for AUTHORISED invoices (Xero allows limited updates for paid/part-paid ACCREC).',
      required: false,
      defaultValue: false,
    }),
    invoice_id: props.editable_sales_invoice_id(true),
    reference: Property.ShortText({ displayName: 'Reference', required: false }),
    due_date: Property.ShortText({
      displayName: 'Due Date (YYYY-MM-DD)',
      required: false,
    }),
    invoice_number: Property.ShortText({
      displayName: 'Invoice Number',
      required: false,
    }),
    branding_theme_id: props.branding_theme_id(false),
    url: Property.ShortText({ displayName: 'Source URL', required: false }),
    contact_id: props.contact_dropdown(false),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Submitted', value: 'SUBMITTED' },
          { label: 'Authorised', value: 'AUTHORISED' },
          { label: 'Voided', value: 'VOIDED' },
          { label: 'Deleted', value: 'DELETED' },
        ],
      },
    }),
    sent_to_contact: Property.Checkbox({
      displayName: 'Mark as Sent to Contact',
      required: false,
      defaultValue: false,
    }),
    replace_all_line_items: Property.Checkbox({
      displayName: 'Replace All Line Items',
      description:
        'If enabled, only the provided line_items will remain. If disabled, we will merge with current lines by updating matching LineItemID and appending new items.',
      required: false,
      defaultValue: false,
    }),
    line_items: Property.Array({
      displayName: 'Line Items (updates/additions)',
      required: false,
      properties: {
        LineItemID: Property.ShortText({ displayName: 'LineItemID', required: false }),
        Description: Property.ShortText({ displayName: 'Description', required: false }),
        Quantity: Property.Number({ displayName: 'Quantity', required: false }),
        UnitAmount: Property.Number({ displayName: 'Unit Amount', required: false }),
        AccountCode: Property.ShortText({ displayName: 'Account Code', required: false }),
        ItemCode: Property.ShortText({ displayName: 'Item Code', required: false }),
        TaxType: Property.ShortText({ displayName: 'Tax Type', required: false }),
        DiscountRate: Property.Number({ displayName: 'Discount %', required: false }),
      },
    }),
  },
  async run(context) {
    const {
      tenant_id,
      invoice_id,
      reference,
      due_date,
      invoice_number,
      branding_theme_id,
      url,
      contact_id,
      status,
      sent_to_contact,
      replace_all_line_items,
      line_items,
    } = context.propsValue as any;

    const baseUrl = 'https://api.xero.com/api.xro/2.0/Invoices';

    let finalLineItems: any[] | undefined = undefined;
    if (Array.isArray(line_items) && line_items.length > 0) {
      if (replace_all_line_items) {
        finalLineItems = line_items;
      } else {
        // Fetch existing invoice to merge line items safely
        const getReq: HttpRequest = {
          method: HttpMethod.GET,
          url: `${baseUrl}/${invoice_id}`,
          authentication: {
            type: AuthenticationType.BEARER_TOKEN,
            token: (context.auth as any).access_token,
          },
          headers: { 'Xero-Tenant-Id': tenant_id },
        };
        const getResp = await httpClient.sendRequest<any>(getReq);
        if (getResp.status !== 200) {
          return getResp;
        }
        const existing = getResp.body?.Invoices?.[0];
        const existingLines: any[] = existing?.LineItems ?? [];

        // Map existing by LineItemID for quick update
        const idToExisting: Record<string, any> = {};
        for (const li of existingLines) {
          if (li.LineItemID) idToExisting[li.LineItemID] = li;
        }

        // Start with existing lines
        const merged: any[] = existingLines.map((li) => ({
          LineItemID: li.LineItemID,
          Description: li.Description,
          Quantity: li.Quantity,
          UnitAmount: li.UnitAmount,
          AccountCode: li.AccountCode,
          TaxType: li.TaxType,
          DiscountRate: li.DiscountRate,
          ItemCode: li.ItemCode,
          Tracking: li.Tracking,
        }));

        // Apply updates and collect new lines
        for (const upd of line_items) {
          if (upd.LineItemID && idToExisting[upd.LineItemID]) {
            const idx = merged.findIndex((m) => m.LineItemID === upd.LineItemID);
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...upd };
            }
          } else {
            // New line (no LineItemID)
            merged.push(upd);
          }
        }

        finalLineItems = merged;
      }
    }

    const body: Record<string, unknown> = {
      Invoices: [
        {
          InvoiceID: invoice_id,
          Type: 'ACCREC',
          ...(reference ? { Reference: reference } : {}),
          ...(due_date ? { DueDate: due_date } : {}),
          ...(invoice_number ? { InvoiceNumber: invoice_number } : {}),
          ...(branding_theme_id ? { BrandingThemeID: branding_theme_id } : {}),
          ...(url ? { Url: url } : {}),
          ...(contact_id ? { Contact: { ContactID: contact_id } } : {}),
          ...(status ? { Status: status } : {}),
          ...(typeof sent_to_contact === 'boolean' ? { SentToContact: sent_to_contact } : {}),
          ...(finalLineItems ? { LineItems: finalLineItems } : {}),
        },
      ],
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: `${baseUrl}/${invoice_id}`,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as any).access_token,
      },
      headers: {
        'Xero-Tenant-Id': tenant_id,
      },
    };

    const result = await httpClient.sendRequest(request);
    if (result.status === 200) {
      return result.body;
    }
    return result;
  },
});


