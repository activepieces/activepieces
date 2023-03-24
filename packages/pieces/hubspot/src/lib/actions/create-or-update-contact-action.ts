import { hubSpotAuthentication } from '../common/props';
import { hubSpotClient } from '../common/client';
import { createAction, Property, assertNotNullOrUndefined } from '@activepieces/framework';

export const hubSpotContactsCreateOrUpdateAction = createAction({
  name: 'create_or_update_contact',
  displayName: 'Create or Update Contact',
  description: 'Updates contact if email address already exists',
  sampleData: {
    'vid': 12345,
    'isNew': true,
  },
  props: {
    authentication: hubSpotAuthentication,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Contact email',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'contact first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'contact last name',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'Zip Code',
      description: 'contact zip code',
      required: false,
    }),
  },

  async run(context) {
    const token = context.propsValue.authentication?.access_token;
    const { email, firstName, lastName, zip } = context.propsValue;

    assertNotNullOrUndefined(token, 'token');
    assertNotNullOrUndefined(email, 'email');

    return await hubSpotClient.contacts.createOrUpdate({
      token,
      email,
      contact: {
        firstname: firstName,
        lastname: lastName,
        zip,
      },
    });
  },
});
