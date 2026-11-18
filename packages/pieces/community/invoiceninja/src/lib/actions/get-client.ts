import { createAction, Property } from '@activepieces/pieces-framework';
import { invoiceninjaAuth } from '../common/auth';
import { invoiceNinjaClient } from '../common/client';
import { invoiceNinjaOutputSchemas } from '../common/output-schemas';

export const getClient = createAction({
  auth: invoiceninjaAuth,
  name: 'getclient_task',
  classification: 'READ',
  displayName: 'Get Client Details from e-mail',
  description: 'Gets the client whose contact has this e-mail. Returns false when there is none.',
  audience: 'human',
  outputSchema: invoiceNinjaOutputSchemas.legacyClient,
  props: {
    email: Property.ShortText({
      displayName: 'Client e-mail address',
      description: 'The e-mail address of one of the client\'s contacts.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const email = invoiceNinjaClient.optionalText(propsValue.email);
    if (email === undefined || !/^[^\s@]+@[^\s@]+$/.test(email)) {
      throw new Error('Client e-mail address must be a valid e-mail address.');
    }
    const result = await invoiceNinjaClient.listPage({ auth: auth.props, entity: 'clients', query: { email }, page: 1, perPage: 1 });
    const client = result.items.find(invoiceNinjaClient.isRecord);
    if (!client) return false;
    const contacts = invoiceNinjaClient.arrayOf(client['contacts']).filter(invoiceNinjaClient.isRecord);
    return [
      {
        client_no_contacts: contacts.length,
        client_id: client['id'],
        client_name: client['name'],
        client_web: client['website'],
        client_private_notes: client['private_notes'],
        client_balance: client['balance'],
        client_paid_to_date: client['paid_to_date'],
        client_payment_balance: client['payment_balance'],
        client_credit_balance: client['credit_balance'],
        client_public_notes: client['public_notes'],
        client_address1: client['address1'],
        client_address2: client['address2'],
        client_phone: client['phone'],
        client_city: client['city'],
        client_state: client['state'],
        client_postcode: client['postal_code'],
        client_vat: client['vat_number'],
        client_display_name: client['display_name'],
        client_contacts: contacts.map((contact) => ({
          first_name: contact['first_name'],
          last_name: contact['last_name'],
          email: contact['email'],
          phone: contact['phone'],
          custom_value1: contact['custom_value1'],
          custom_value2: contact['custom_value2'],
          custom_value3: contact['custom_value3'],
          custom_value4: contact['custom_value4'],
        })),
      },
    ];
  },
});
