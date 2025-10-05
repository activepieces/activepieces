import { Property, createAction } from '@activepieces/pieces-framework';
import { simplyBookAuth, makeApiRequest } from '../common';

export const createClientAction = createAction({
  auth: simplyBookAuth,
  name: 'create_client',
  displayName: 'Create Client',
  description: 'Create a new client in SimplyBook.me',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Client\'s first name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Client\'s last name',
      required: true,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Client\'s email address',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Client\'s phone number',
      required: false,
    }),
    address: Property.LongText({
      displayName: 'Address',
      description: 'Client\'s address',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'Client\'s city',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State/Province',
      description: 'Client\'s state or province',
      required: false,
    }),
    zipCode: Property.ShortText({
      displayName: 'ZIP/Postal Code',
      description: 'Client\'s ZIP or postal code',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Client\'s country',
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Additional notes about the client',
      required: false,
    }),
  },
  async run(context) {
    const { firstName, lastName, email, phone, address, city, state, zipCode, country, notes } = context.propsValue;
    
    const params = {
      first_name: firstName,
      last_name: lastName,
      email: email,
      ...(phone && { phone }),
      ...(address && { address }),
      ...(city && { city }),
      ...(state && { state }),
      ...(zipCode && { zip_code: zipCode }),
      ...(country && { country }),
      ...(notes && { notes }),
    };

    return await makeApiRequest(context.auth, 'addClient', params);
  },
});
