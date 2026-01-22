import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';
import { xeroAuth } from '../..';
import { props } from '../common/props';

export const xeroCreateBill = createAction({
  auth: xeroAuth,
  name: 'xero_create_bill',
  displayName: 'Create Bill',
  description: 'Creates a new bill (Accounts Payable).',
  props: {
    tenant_id: props.tenant_id,
    contact_id: props.contact_dropdown(true),
    line_item: Property.Object({
      displayName: 'Line Item',
      description: 'At minimum, provide a Description.',
      required: true,
      defaultValue: {
        Description: 'Goods/Services',
      },
    }),
    date: Property.ShortText({
      displayName: 'Date',
      description: 'Date the bill was issued (YYYY-MM-DD). Optional.',
      required: false,
    }),
    due_date: Property.ShortText({
      displayName: 'Due Date',
      description: 'Date the bill is due (YYYY-MM-DD). Optional.',
      required: false,
    }),
    line_amount_types: Property.StaticDropdown({
      displayName: 'Line Amount Types',
      required: false,
      options: {
        options: [
          { label: 'Exclusive', value: 'Exclusive' },
          { label: 'Inclusive', value: 'Inclusive' },
          { label: 'NoTax', value: 'NoTax' },
        ],
      },
    }),
    invoice_number: Property.ShortText({
      displayName: 'Bill Number (Reference)',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: false,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Submitted', value: 'SUBMITTED' },
          { label: 'Authorised', value: 'AUTHORISED' },
        ],
      },
      defaultValue: 'DRAFT',
    }),
  },
  async run(context) {
    const {
      tenant_id,
      contact_id,
      line_item,
      date,
      due_date,
      line_amount_types,
      invoice_number,
      status,
    } = context.propsValue;

    const url = 'https://api.xero.com/api.xro/2.0/Invoices';

    const payload: Record<string, unknown> = {
      Invoices: [
        {
          Type: 'ACCPAY',
          Contact: { ContactID: contact_id },
          LineItems: [line_item],
          ...(date ? { Date: date } : {}),
          ...(due_date ? { DueDate: due_date } : {}),
          ...(line_amount_types ? { LineAmountTypes: line_amount_types } : {}),
          ...(invoice_number ? { InvoiceNumber: invoice_number } : {}),
          ...(status ? { Status: status } : {}),
        },
      ],
    };

    const request: HttpRequest = {
      method: HttpMethod.POST,
      url,
      body: payload,
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


