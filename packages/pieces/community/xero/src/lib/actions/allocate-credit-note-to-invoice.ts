import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroAllocateCreditNoteToInvoice = createAction({
  auth: xeroAuth,
  name: 'xero_allocate_credit_note_to_invoice',
  displayName: 'Allocate Credit Note to Invoice',
  description: 'Allocates a credit note to a specific invoice.',
  props: {
    tenant_id: props.tenant_id,
    credit_note_id: props.credit_note_id(true),
    invoice_id: props.invoice_id(true),
    amount: Property.Number({
      displayName: 'Amount',
      description: 'The amount of the credit to allocate.',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Allocation Date',
      description: 'Date of allocation. Format: YYYY-MM-DD. Optional.',
      required: false,
    }),
  },
  async run(context) {
    const { tenant_id, credit_note_id, invoice_id, amount, date } =
      context.propsValue;

    const url = `https://api.xero.com/api.xro/2.0/CreditNotes/${credit_note_id}/Allocations`;

    const body: Record<string, unknown> = {
      Allocations: [
        {
          Invoice: {
            InvoiceID: invoice_id,
          },
          Amount: amount,
          ...(date ? { Date: date } : {}),
        },
      ],
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      body,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.access_token,
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


