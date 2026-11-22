import { createAction, Property } from '@activepieces/pieces-framework';
import { bokioAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';

export const getAnInvoice = createAction({
  auth: bokioAuth,
  name: 'getAnInvoice',
  classification: 'READ',
  displayName: 'Get an invoice',
  description: 'Retrieve a specific invoice by its ID',
  audience: 'both',
  aiMetadata: { description: 'Retrieves a single invoice from a Bokio company by its invoice ID. Use when you already have the invoice ID and need its full details. Idempotent read-only lookup.', idempotent: true },
  outputSchema: bokioSchemas.invoice,
  props: {
    invoiceId: Property.ShortText({
      displayName: 'Invoice ID',
      placeholder: 'e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6',
      description: 'Invoice UUID. Get it from List Invoices or the output of Create Invoice.',
      required: true,
    }),
  },
  async run(context) {
    const { invoiceId } = context.propsValue;
    return bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.GET,
      path: `/invoices/${bokioBuilders.requireUuid({ value: invoiceId, kind: 'invoice' })}`,
      operation: 'get invoice',
    });
  },
});
