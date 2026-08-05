import { createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroGetInvoiceHistory = createAction({
  auth: xeroAuth,
  name: 'xero_get_invoice_history',
  displayName: 'Get Invoice History',
  description: 'Returns a list of history records for a given invoice ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieve the history and notes for a Xero invoice by its InvoiceID. Read-only and idempotent; returns HistoryRecords describing changes, the acting user, timestamps, and details.',
    idempotent: true,
  },
  props: {
    tenant_id: props.tenant_id,
    invoice_id: props.invoice_id(true),
  },
  async run(context) {
    const { tenant_id, invoice_id } = context.propsValue;

    const request: HttpRequest = {
      method: HttpMethod.GET,
      url: `https://api.xero.com/api.xro/2.0/Invoices/${invoice_id}/History`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: (context.auth as { access_token: string }).access_token,
      },
      headers: { 'Xero-Tenant-Id': tenant_id as string },
    };

    const result = await httpClient.sendRequest(request);
    if (result.status === 200) {
      return result.body;
    }
    return result;
  },
});
