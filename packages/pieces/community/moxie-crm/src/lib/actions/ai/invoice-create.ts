import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../../auth';
import { credentialsOf } from '../../common';
import { moxieFields } from '../../common/fields';
import { moxieOperations } from '../../common/operations';
import { moxieProps } from '../../common/props';
import { moxieActionOutputSchemas } from '../../output-schemas';

export const moxieInvoiceCreateAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_invoice_create',
  classification: 'WRITE',
  displayName: 'Create Invoice',
  description: 'Creates a draft invoice in Moxie, and optionally sends it.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates an invoice with line items for a client matched by exact name. It stays a DRAFT unless Send Invoice is on, in which case Moxie emails it to the listed contacts. Use to bill a client; template names come from List Invoice Templates. Not idempotent: each call creates a new invoice, and with Send Invoice on each call emails the client.',
    idempotent: false,
  },
  outputSchema: moxieActionOutputSchemas.invoice,
  props: {
    clientName: Property.ShortText({
      displayName: 'Client Name',
      description: 'Exact name of the client to bill, from Search Clients.',
      required: true,
    }),
    templateName: Property.ShortText({
      displayName: 'Invoice Template',
      description: 'Exact invoice template name, from List Invoice Templates. Leave empty for the default.',
      required: false,
    }),
    items: Property.Array({
      displayName: 'Line Items',
      description: 'At least one line, each with a description, quantity and rate.',
      required: true,
      properties: {
        description: Property.ShortText({ displayName: 'Description', required: true }),
        quantity: Property.Number({ displayName: 'Quantity', required: true }),
        rate: Property.Number({ displayName: 'Rate', description: 'Price per unit.', required: true }),
        taxable: Property.Checkbox({ displayName: 'Taxable', required: false }),
        projectName: Property.ShortText({ displayName: 'Project Name', description: 'Exact project name to link the line to.', required: false }),
      },
    }),
    ...moxieProps.fromSpecs({ specs: moxieFields.invoice, audience: 'ai' }),
    send: Property.Checkbox({
      displayName: 'Send Invoice',
      description: 'Off (default) keeps the invoice as a draft. On emails it to the contacts below.',
      required: false,
      defaultValue: false,
    }),
    sendToContacts: Property.Array({
      displayName: 'Send To Contacts',
      description: 'Emails of the client contacts who receive the invoice. Only used when Send Invoice is on.',
      required: false,
    }),
    emailTemplateName: Property.ShortText({
      displayName: 'Email Template',
      description: 'Exact email template name for the invoice email, from List Email Templates. Only used when Send Invoice is on.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    return moxieOperations.createInvoice({ credentials: credentialsOf({ auth }), values: propsValue });
  },
});
