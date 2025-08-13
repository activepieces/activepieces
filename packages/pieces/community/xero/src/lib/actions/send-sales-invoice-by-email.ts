import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { makeRequest } from '../common/client';
import { invoiceIdDropdown, props } from '../common/props';

export const sendSalesInvoiceByEmail = createAction({
  auth: xeroAuth,
  name: 'sendSalesInvoiceByEmail',
  displayName: 'Send Sales Invoice by Email',
  description: 'Sends a sales invoice via email to a contact in Xero',
  props: {
    tenant_id: props.tenant_id,
    invoice_id: invoiceIdDropdown,
  },
  async run({ auth, propsValue }) {
    const response = await makeRequest(
      auth.access_token,
      HttpMethod.POST,
      `/Invoices/${propsValue.invoice_id}/Email`,
      null,
      {
        'Xero-Tenant-Id': propsValue.tenant_id,
      }
    );

    return response;
  },
});
