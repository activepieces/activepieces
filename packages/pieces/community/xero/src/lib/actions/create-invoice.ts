import { Property, createAction } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  HttpMethod,
  HttpRequest,
  httpClient,
} from '@activepieces/pieces-common';

import { props } from '../common/props';
import { xeroAuth } from '../..';
import { xeroOutputSchemas } from '../output-schemas';

export const xeroCreateInvoice = createAction({
  auth: xeroAuth,
  name: 'xero_create_invoice',
  classification: 'DESTRUCTIVE',
  description: 'Create Xero Invoice',
  displayName: 'Create or Update Invoice',
  audience: 'human',
  aiMetadata: {
    description:
      'Create a new ACCREC sales invoice for a customer (resolving or creating the contact from name/email) or update an existing invoice when an invoice ID is supplied. Use this for a single sales invoice; for recurring billing use Create Repeating Sales Invoice. Supplying an invoice ID updates that record (idempotent on a fixed ID); omitting it creates a new invoice each call.',
    idempotent: false,
  },
  outputSchema: xeroOutputSchemas.invoiceEnvelope,
  props: {
    tenant_id: props.tenant_id,
    invoice_id: props.invoice_id(false),
    contact_id: props.contact_dropdown(false),
    name: props.contact_name(true),
    email: props.contact_email(false),
    line_item: Property.Object({
      displayName: 'Line Item',
      description:
        'One invoice line as key/value pairs, e.g. Description, Quantity, UnitAmount, AccountCode (such as 200 for Sales) and TaxType. Use List Accounts and List Tax Rates to find valid codes.',
      required: true,
    }),
    date: Property.ShortText({
      displayName: 'Date Prepared',
      description: 'Date the invoice was created. Format example: 2019-03-11',
      required: false,
    }),
    due_date: Property.ShortText({
      displayName: 'Due Date',
      description: 'Due date of the invoice. Format example: 2019-03-11',
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

    if (result.status === 200) {
      return result.body;
    }

    return result;
  },
});
