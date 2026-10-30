import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieDropdowns } from '../common/dropdowns';
import { moxieFields } from '../common/fields';
import { moxieOperations } from '../common/operations';
import { moxieProps } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieCreateInvoiceAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_create_invoice',
  classification: 'WRITE',
  displayName: 'Create Invoice',
  description: 'Create an invoice with line items. It stays a draft unless you turn on Send Invoice.',
  audience: 'human',
  aiMetadata: {
    description:
      'Creates a Moxie invoice with client, template and email template picked from lists, as a draft unless Send Invoice is on. For agents use moxie_invoice_create. Not idempotent: each run creates another invoice and, when sending, emails the client.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.invoice,
  props: {
    clientName: moxieDropdowns.clientName({ required: true, description: 'The client to bill.' }),
    templateName: moxieDropdowns.stringList({
      required: false,
      displayName: 'Invoice Template',
      description: 'Leave empty for the default template.',
      path: '/action/invoiceTemplates/list',
    }),
    items: Property.Array({
      displayName: 'Line Items',
      required: true,
      properties: {
        description: Property.ShortText({ displayName: 'Description', required: true }),
        quantity: Property.Number({ displayName: 'Quantity', required: true }),
        rate: Property.Number({ displayName: 'Rate', description: 'Price per unit.', required: true }),
        taxable: Property.Checkbox({ displayName: 'Taxable', required: false }),
        projectName: Property.ShortText({ displayName: 'Project Name', description: 'Exact project name to link the line to.', required: false }),
      },
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.invoice, audience: 'human' }),
    send: Property.Checkbox({
      displayName: 'Send Invoice',
      description: 'Off (default) keeps the invoice as a draft. On emails it to the contacts below.',
      required: false,
      defaultValue: false,
    }),
    sendToContacts: moxieDropdowns.clientContactEmails({ required: false }),
    emailTemplateName: moxieDropdowns.stringList({
      required: false,
      displayName: 'Email Template',
      description: 'Email used to send the invoice. Only used when Send Invoice is on.',
      path: '/action/emailTemplates/list',
    }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.createInvoice({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
