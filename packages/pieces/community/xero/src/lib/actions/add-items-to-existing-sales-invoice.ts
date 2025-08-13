import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { invoiceIdDropdown, props } from '../common/props';

export const addItemsToExistingSalesInvoice = createAction({
  auth: xeroAuth,
  name: 'addItemsToExistingSalesInvoice',
  displayName: 'Add Items to Existing Sales Invoice',
  description: 'Adds line items to an existing sales invoice in Xero',
  props: {
    tenant_id: props.tenant_id,
    invoice_id: invoiceIdDropdown,
    lineItems: Property.Array({
      displayName: 'Line Items',
      description: 'The line items to add to the existing sales invoice',
      required: true,
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
  },
  async run({ auth, propsValue }) {
    // Validate that the invoice ID is provided
    if (!propsValue.invoice_id) {
      throw new Error('Invoice ID is required to add line items.');
    }

    const invoiceUpdateData = {
      LineItems: propsValue.lineItems,
    };

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      `/Invoices/${propsValue.invoice_id}`,
      invoiceUpdateData,
      {
        'Xero-Tenant-Id': propsValue.tenant_id,
      }
    );

    return response;
  },
});
