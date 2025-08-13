import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { invoiceIdDropdown, props } from '../common/props';

export const updateSalesInvoice = createAction({
  auth: xeroAuth,
  name: 'updateSalesInvoice',
  displayName: 'Update Sales Invoice',
  description: 'Updates details of an existing sales invoice in Xero',
  props: {
    tenant_id: props.tenant_id,
    invoice_id: invoiceIdDropdown,
    date: Property.ShortText({
      displayName: 'Date',
      description: 'The date of the invoice (YYYY-MM-DD format). Optional.',
      required: false,
    }),
    dueDate: Property.ShortText({
      displayName: 'Due Date',
      description: 'The due date of the invoice (YYYY-MM-DD format). Optional.',
      required: false,
    }),
    lineItems: Property.Array({
      displayName: 'Line Items',
      description: 'The line items for the invoice',
      required: false,
      properties: {
        description: Property.ShortText({
          displayName: 'Description',
          description: 'Description of the line item',
          required: true,
        }),
        quantity: Property.Number({
          displayName: 'Quantity',
          description: 'Quantity of the item',
          required: true,
        }),
        unitAmount: Property.Number({
          displayName: 'Unit Amount',
          description: 'Unit price of the item',
          required: true,
        }),
        accountCode: Property.ShortText({
          displayName: 'Account Code',
          description: 'The account code for the line item',
          required: false,
        }),
        taxType: Property.ShortText({
          displayName: 'Tax Type',
          description: 'The tax type for the line item',
          required: false,
        }),
      },
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'Optional reference for the invoice',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The status of the invoice',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Submitted', value: 'SUBMITTED' },
          { label: 'Authorised', value: 'AUTHORISED' },
          { label: 'Paid', value: 'PAID' },
          { label: 'Voided', value: 'VOIDED' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const invoiceData: any = {
      ...(propsValue.date && { Date: propsValue.date }),
      ...(propsValue.dueDate && { DueDate: propsValue.dueDate }),
      ...(propsValue.reference && { Reference: propsValue.reference }),
      ...(propsValue.status && { Status: propsValue.status }),
      ...(propsValue.lineItems && {
        LineItems: propsValue.lineItems.map((item: any) => ({
          Description: item.description,
          Quantity: item.quantity,
          UnitAmount: item.unitAmount,
          ...(item.accountCode && { AccountCode: item.accountCode }),
          ...(item.taxType && { TaxType: item.taxType }),
        })),
      }),
    };
    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      `/Invoices/${propsValue.invoice_id}`,
      invoiceData,
      {
        'Xero-Tenant-Id': propsValue.tenant_id,
      }
    );

    return response;
  },
});
