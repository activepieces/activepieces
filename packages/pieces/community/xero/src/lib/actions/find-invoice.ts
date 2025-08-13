import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';

export const findInvoice = createAction({
  auth: xeroAuth,
  name: 'findInvoice',
  displayName: 'Find Invoice',
  description: 'Finds an invoice by number or reference in Xero',
  props: {
    tenant_id: Property.ShortText({
      displayName: 'Tenant ID',
      description: 'The ID of the Xero tenant',
      required: true,
    }),
    invoiceNumber: Property.ShortText({
      displayName: 'Invoice Number',
      description: 'The number of the invoice to search for. Optional.',
      required: false,
    }),
    reference: Property.ShortText({
      displayName: 'Reference',
      description: 'The reference of the invoice to search for. Optional.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const { tenant_id, invoiceNumber, reference } = propsValue;

    if (!invoiceNumber && !reference) {
      throw new Error(
        'You must provide either an Invoice Number or a Reference to search.'
      );
    }

    const queryParams = [];
    if (invoiceNumber) {
      queryParams.push(`InvoiceNumber="${encodeURIComponent(invoiceNumber)}"`);
    }
    if (reference) {
      queryParams.push(`Reference="${encodeURIComponent(reference)}"`);
    }
    const query = queryParams.join(' AND ');

    const response = await makeRequest(
      auth.access_token,
      HttpMethod.GET,
      `/Invoices?where=${query}`,
      null,
      {
        'Xero-Tenant-Id': tenant_id,
      }
    );

    return {
      success: true,
      invoices: response.Invoices || [],
      message: response.Invoices?.length
        ? `${response.Invoices.length} invoice(s) found.`
        : 'No invoices found.',
    };
  },
});
