import { createAction, Property } from '@activepieces/pieces-framework';
import { simplybookAuth, makeJsonRpcCall, SimplybookAuth } from '../common';

export const createClient = createAction({
  auth: simplybookAuth,
  name: 'create_client',
  displayName: 'Add Client',
  description: 'Add a new client with specified data. Email, phone, or both may be required (check company settings).',
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Client name',
      required: true
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Client email address',
      required: false
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Client phone number (e.g., +1502-810-4521)',
      required: false
    }),
    address1: Property.ShortText({
      displayName: 'Address Line 1',
      description: 'Client address line 1',
      required: false
    }),
    address2: Property.ShortText({
      displayName: 'Address Line 2',
      description: 'Client address line 2',
      required: false
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'Client city',
      required: false
    }),
    zip: Property.ShortText({
      displayName: 'ZIP Code',
      description: 'Client ZIP/postal code',
      required: false
    }),
    countryId: Property.ShortText({
      displayName: 'Country ID',
      description: 'Client country ID',
      required: false
    })
  },
  async run(context) {
    const auth = context.auth.props;
    const {
      name,
      email,
      phone,
      address1,
      address2,
      city,
      zip,
      countryId
    } = context.propsValue;

    const clientData: any = { name };

    if (email) clientData.email = email;
    if (phone) clientData.phone = phone;
    if (address1) clientData.address1 = address1;
    if (address2) clientData.address2 = address2;
    if (city) clientData.city = city;
    if (zip) clientData.zip = zip;
    if (countryId) clientData.country_id = countryId;

    const params = [clientData];
    const clientId = await makeJsonRpcCall<number>(auth, 'addClient', params);

    return { clientId };
  }
});
