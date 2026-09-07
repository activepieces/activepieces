import { createAction } from '@activepieces/pieces-framework';
import { makeClient } from '../common';
import { moxieCRMAuth } from '../auth';

export const moxieListInvoiceTemplatesAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_list_invoice_templates',
  classification: 'READ',
  displayName: 'List Invoice Templates',
  description: 'Retrieve the invoice template names of the workspace.',
  audience: 'both',
  aiMetadata: {
    description:
      'Returns the names of the invoice templates configured in the Moxie workspace. Use to pick a valid template name before creating an invoice. Read-only and idempotent.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const client = await makeClient(auth);
    return await client.listInvoiceTemplates();
  },
});
