import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../common/auth';
import { invoiceNinjaClient } from '../common/client';
import { invoiceNinjaOutputSchemas } from '../common/output-schemas';

export const createClient = createAction({
  auth: invoiceninjaAuth,
  name: 'create_client',
  classification: 'WRITE',
  displayName: 'Create Client',
  description: 'Creates a new client with a primary contact in Invoice Ninja.',
  audience: 'both',
  aiMetadata: {
    description: 'Creates an Invoice Ninja client with one primary contact. Requires business name, contact email, address line 1 and city; contact names, phone, VAT number, notes, address line 2, state and postcode are optional. Returns {data: client} with the new client id at data.id. Not idempotent: each call creates a new client even if one with the same email exists, so use Find Clients first.',
    idempotent: false,
  },
  outputSchema: invoiceNinjaOutputSchemas.legacyClientCreated,
  props: {
    client_first_name: Property.ShortText({ displayName: 'Contact First Name', description: 'First name of the client contact (optional).', required: false }),
    client_last_name: Property.ShortText({ displayName: 'Contact Last Name', description: 'Last name of the client contact (optional).', required: false }),
    client_phone: Property.ShortText({ displayName: 'Contact Phone', description: 'Phone number of the client contact (optional).', required: false }),
    client_email: Property.ShortText({ displayName: 'Contact Email', description: 'E-mail of the client contact.', required: true }),
    client_send_email: Property.Checkbox({
      displayName: 'Send invoices to the client',
      description: 'Should Invoice Ninja e-mail invoices to this contact?',
      defaultValue: false,
      required: true,
    }),
    client_business_name: Property.ShortText({ displayName: 'Business Name', description: 'Name of the business or person.', required: true }),
    client_tax_no: Property.ShortText({ displayName: 'VAT / Tax Number', description: 'Leave blank if not a business (optional).', required: false }),
    client_private_notes: Property.LongText({ displayName: 'Private Notes', description: 'Notes not visible to the client (optional).', required: false }),
    client_address1: Property.ShortText({ displayName: 'Address Line 1', description: 'Usually street name and number.', required: true }),
    client_address2: Property.ShortText({ displayName: 'Address Line 2', description: 'Additional address details (optional).', required: false }),
    client_city: Property.ShortText({ displayName: 'City / Town', required: true }),
    client_state: Property.ShortText({ displayName: 'State / County', description: 'Optional.', required: false }),
    client_postcode: Property.ShortText({ displayName: 'Postcode', description: 'Optional.', required: false }),
  },
  async run({ auth, propsValue }) {
    const name = invoiceNinjaClient.optionalText(propsValue.client_business_name);
    const email = invoiceNinjaClient.optionalText(propsValue.client_email);
    if (name === undefined) throw new Error('Business Name is required.');
    if (email === undefined || !/^[^\s@]+@[^\s@]+$/.test(email)) throw new Error('Contact Email must be a valid e-mail address.');
    const body = invoiceNinjaClient.compact({
      name,
      private_notes: invoiceNinjaClient.optionalText(propsValue.client_private_notes),
      address1: invoiceNinjaClient.optionalText(propsValue.client_address1),
      address2: invoiceNinjaClient.optionalText(propsValue.client_address2),
      city: invoiceNinjaClient.optionalText(propsValue.client_city),
      state: invoiceNinjaClient.optionalText(propsValue.client_state),
      postal_code: invoiceNinjaClient.optionalText(propsValue.client_postcode),
      vat_number: invoiceNinjaClient.optionalText(propsValue.client_tax_no),
      contacts: [
        invoiceNinjaClient.compact({
          first_name: invoiceNinjaClient.optionalText(propsValue.client_first_name),
          last_name: invoiceNinjaClient.optionalText(propsValue.client_last_name),
          phone: invoiceNinjaClient.optionalText(propsValue.client_phone),
          email,
          send_email: propsValue.client_send_email === true,
          is_primary: true,
        }),
      ],
    });
    return invoiceNinjaClient.envelopeOf(
      await invoiceNinjaClient.request({ auth: auth.props, method: HttpMethod.POST, path: '/clients', body }),
    );
  },
});
