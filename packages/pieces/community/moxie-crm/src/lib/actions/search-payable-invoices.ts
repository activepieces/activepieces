import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieInput } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieSearchPayableInvoicesAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_search_payable_invoices',
  classification: 'SEARCH',
  displayName: 'Search Open Invoices',
  description: 'List outstanding invoices, for one client or by invoice id.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists outstanding (sent and not fully paid) Moxie invoices with totals, payments and line items: every one, those of the client whose exact name is given (an unknown name returns an empty list), or the one invoice with an exact Invoice ID. Use to find an invoice number before recording a payment or chasing a balance. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.invoiceList,
  props: {
    clientName: Property.ShortText({
      displayName: 'Client Name',
      description: 'Exact client name. Leave empty to list the open invoices of every client.',
      required: false,
    }),
    id: Property.ShortText({
      displayName: 'Invoice ID',
      description: 'Exact invoice id. When set, the client name is ignored.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.GET,
      path: '/action/payableInvoices/search',
      query: {
        query: moxieInput.text({ value: propsValue.clientName }),
        id: moxieInput.optionalId({ value: propsValue.id, field: 'Invoice ID' }),
      },
    });
  },
});
