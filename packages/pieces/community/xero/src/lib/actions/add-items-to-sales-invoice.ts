import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroAddItemsToSalesInvoice = createAction({
  auth: xeroAuth,
  name: 'xero_add_items_to_sales_invoice',
  displayName: 'Add Items to Existing Sales Invoice',
  description: 'Adds line items to an existing sales invoice (ACCREC).',
  props: {
    tenant_id: props.tenant_id,
    invoice_id: props.invoice_id(true),
    allow_authorised: Property.Checkbox({
      displayName: 'Allow AUTHORISED invoices',
      description: 'Enable adding items to AUTHORISED invoices (Xero allows limited updates for paid/part-paid ACCREC).',
      required: false,
      defaultValue: false,
    }),
    new_line_items: Property.Array({
      displayName: 'New Line Items',
      required: true,
      properties: {
        Description: Property.ShortText({ displayName: 'Description', required: true }),
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
    const { tenant_id, invoice_id, new_line_items } = context.propsValue as {
      tenant_id: string;
      invoice_id: string;
      new_line_items: Record<string, unknown>[];
    };

    const getUrl = `https://api.xero.com/api.xro/2.0/Invoices/${invoice_id}`;
    const getRequest: HttpRequest = {
      method: HttpMethod.GET,
      url: getUrl,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as any).access_token,
      },
      headers: { 'Xero-Tenant-Id': tenant_id },
    };
    const getResp = await httpClient.sendRequest<any>(getRequest);
    if (getResp.status !== 200) {
      return getResp;
    }

    const existingInvoice = getResp.body?.Invoices?.[0];
    if (!existingInvoice) {
      throw new Error('Invoice not found.');
    }

    const existingLineItems = (existingInvoice.LineItems || []).map((li: any) => ({
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

    const mergedLineItems = [
      ...existingLineItems,
      ...new_line_items,
    ];

    const postUrl = `https://api.xero.com/api.xro/2.0/Invoices/${invoice_id}`;
    const body = {
      Invoices: [
        {
          Type: 'ACCREC',
          LineItems: mergedLineItems,
        },
      ],
    };

    const postRequest: HttpRequest = {
      method: HttpMethod.POST,
      url: postUrl,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as any).access_token,
      },
      headers: { 'Xero-Tenant-Id': tenant_id },
    };

    const updateResp = await httpClient.sendRequest(postRequest);
    if (updateResp.status === 200) {
      return updateResp.body;
    }
    return updateResp;
  },
});


