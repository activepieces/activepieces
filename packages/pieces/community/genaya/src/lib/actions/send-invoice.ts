import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { genayaAuth } from '../auth';
import { genayaApi } from '../common/client';
import { genayaInput } from '../common/input';
import { genayaOutput } from '../common/mappers';
import { genayaProps } from '../common/props';
import { GenayaInvoice } from '../common/types';

export const sendInvoice = createAction({
  auth: genayaAuth,
  name: 'send_invoice',
  classification: 'WRITE',
  displayName: 'Send Invoice',
  description:
    'Marks an invoice as sent in Genaya: a draft moves to Sent and the sent date is recorded. This step does not email the invoice to the client.',
  audience: 'both',
  aiMetadata: {
    description:
      'Mark a Genaya invoice as sent by its ID: sets the sent flag and time, and moves a draft invoice to the Sent status (an invoice already past draft keeps its status). It does not email the client. Safe to retry; a second call leaves the invoice sent.',
    idempotent: true,
  },
  props: {
    invoice: genayaProps.invoiceDropdown,
  },
  async run(context) {
    const invoiceId = genayaInput.text(context.propsValue.invoice);
    if (invoiceId === undefined) {
      throw new Error('Select the invoice to send.');
    }
    const response = await genayaApi.request<{ data: GenayaInvoice }>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/invoices/${encodeURIComponent(invoiceId)}/send`,
    });
    return genayaOutput.invoice(response.data);
  },
});
