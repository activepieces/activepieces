import { createAction } from '@activepieces/pieces-framework';
import { odooAuth } from '../../auth';
import { odooApps } from '../../common/app-fields';
import { OdooClient } from '../../common/client';
import { odooRecords } from '../../common/records';
import { odooInput } from '../../common/values';
import { atomicProps } from './common';
import { atomicSchemas } from './output-schemas';

export const odooPostInvoice = createAction({
  auth: odooAuth,
  name: 'odoo_post_invoice',
  classification: 'WRITE',
  displayName: 'Post Invoice',
  description: 'Validate (post) a draft Odoo invoice so it gets its number.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Posts one draft Odoo invoice, bill or credit note (action_post): it gets its final number and becomes due; fails if Odoo asks for an extra confirmation step. Needs Invoicing. Not idempotent: a second call fails because only drafts can be posted.',
    idempotent: false,
  },
  outputSchema: atomicSchemas.invoice,
  props: {
    invoice_id: atomicProps.idProp({ displayName: 'Invoice ID', description: 'account.move ID from odoo_create_invoice or odoo_find_invoices.' }),
  },
  async run(context) {
    const id = odooInput.toId({ value: context.propsValue.invoice_id, label: 'Invoice ID' });
    const client = OdooClient.fromAuth({ auth: context.auth.props });
    await client.callAllowNone({ model: odooApps.invoice.model, method: 'action_post', args: [[id]] });
    const invoice = await odooRecords.readApp({ client, model: odooApps.invoice.model, id, wanted: odooApps.invoice.fields, manyToOne: odooApps.invoice.manyToOne });
    if (invoice['state'] === 'draft') {
      throw new Error('Odoo asked for a confirmation step before posting this invoice. Post it from the Odoo screen.');
    }
    return invoice;
  },
});
