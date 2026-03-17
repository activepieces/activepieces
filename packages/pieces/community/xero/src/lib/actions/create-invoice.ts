import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { props } from '../common/props';
import dayjs from 'dayjs';
import { xeroAuth } from '../..';

export const xeroCreateInvoice = createAction({
  auth: xeroAuth,
  name: 'xero_create_invoice',
  description: 'Create Xero Invoice',
  displayName: 'Create or Update Invoice',
  props: {
    tenant_id: props.tenant_id,
    invoice_id: props.invoice_id(false),
    contact_id: props.contact_dropdown(false),
    name: props.contact_name(true),
    email: props.contact_email(false),
    line_item: Property.Object({
      displayName: 'Line Item',
      description: 'Invoice line items',
      required: true,
      defaultValue: {
        AccountCode: 200,
        Quantity: 0,
        UnitAmount: 0,
        LineAmount: 0,
        TaxType: 'NONE',
        Description: 'description',
      },
    }),
    date: Property.ShortText({
      displayName: 'Date Prepared',
      description: 'Date the invoice was created. Format example: 2019-03-11',
      required: false,
    }),
    due_date: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date of the invoice. Format example: 2019-03-11',
      defaultValue: dayjs().format('YYYY-MM-DD'),
      required: true,
    }),
    reference: Property.ShortText({
      displayName: 'Invoice Reference',
      description: 'Reference number of the Invoice',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Invoice Status',
      required: true,
      options: {
        options: [
          { label: 'Draft', value: 'DRAFT' },
          { label: 'Submitted', value: 'SUBMITTED' },
          { label: 'Authorised', value: 'AUTHORISED' },
          { label: 'Deleted', value: 'DELETED' },
          { label: 'Voided', value: 'VOIDED' },
        ],
      },
    }),
  },
  async run(context) {
    const { invoice_id, contact_id, email, name, tenant_id, ...invoice } =
      context.propsValue;

    const contact: Record<string, unknown> = { Name: name };
    if (email) contact['EmailAddress'] = email;
    if (contact_id) contact['ContactID'] = contact_id;

    const body = {
      Invoices: [
        {
          Type: 'ACCREC',
          Contact: contact,
          LineItems: invoice.line_item ? [invoice.line_item] : [],
          Date: invoice.date,
          DueDate: invoice.due_date,
          Reference: invoice.reference,
          Status: invoice.status,
        },
      ],
    };

    const url = 'https://api.xero.com/api.xro/2.0/Invoices';
    const request: HttpRequest = {
      method: HttpMethod.POST,
      url: invoice_id ? `${url}/${invoice_id}` : url,
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
    console.debug('Invoice creation response', result);

    if (result.status === 200) {
      return result.body;
    }

    return result;
  },
});
