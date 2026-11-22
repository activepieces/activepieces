import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { bokioAuth } from '../common/auth';
import { bokioClient } from '../common/client';
import { bokioBuilders } from '../common/builders';
import { bokioSchemas } from '../common/schemas';

export const publishInvoice = createAction({
  auth: bokioAuth,
  name: 'publish_invoice',
  classification: 'WRITE',
  displayName: 'Publish Invoice',
  description: 'Publishes a draft invoice so it gets a number and is booked.',
  audience: 'both',
  aiMetadata: {
    description:
      'Publishes a DRAFT invoice in Bokio (invoiceId from List Invoices): it gets its final invoice number, is booked in the ledger and can no longer be edited, only credited. Returns the published invoice. Does not email the invoice. Not idempotent: a second call fails because the invoice is no longer a draft.',
    idempotent: false,
  },
  outputSchema: bokioSchemas.invoice,
  props: {
    invoiceId: Property.ShortText({
      displayName: 'Invoice ID',
      placeholder: 'e.g. 3fa85f64-5717-4562-b3fc-2c963f66afa6',
      description: 'Draft invoice UUID. Get it from List Invoices (status draft) or the output of Create Invoice.',
      required: true,
    }),
  },
  async run(context) {
    return bokioClient.request<unknown>({
      auth: context.auth.props,
      method: HttpMethod.POST,
      path: `/invoices/${bokioBuilders.requireUuid({ value: context.propsValue.invoiceId, kind: 'invoice' })}/publish`,
      operation: 'publish invoice',
    });
  },
});
