import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroSendInvoiceEmail = createAction({
  auth: xeroAuth,
  name: 'xero_send_invoice_email',
  displayName: 'Send Sales Invoice by Email',
  description: 'Sends a sales invoice via email to a contact.',
  props: {
    tenant_id: props.tenant_id,
    invoice_id: props.sales_invoice_id(true),
  },
  async run(context) {
    const { tenant_id, invoice_id } = context.propsValue;

    const url = `https://api.xero.com/api.xro/2.0/Invoices/${invoice_id}/Email`;

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
      },
      headers: {
        'Xero-Tenant-Id': tenant_id,
      },
    };

    const result = await httpClient.sendRequest(request);
    // Xero returns 204 on success
    if (result.status === 204) {
      return { success: true };
    }
    return result;
  },
});


