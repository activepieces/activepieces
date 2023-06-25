import { hubSpotClient } from '../common/client';
import { createAction, Property } from '@activepieces/pieces-framework';
import { assertNotNullOrUndefined } from "@activepieces/pieces-common";
import { hubspotAuth } from '../../';

export const hubSpotContactsCreateOrUpdateAction = createAction({
  auth: hubspotAuth,
  action: {
    name: 'create_or_update_contact',
    displayName: 'Create or Update Contact',
    description: 'Updates contact if email address already exists',
    sampleData: {
      'vid': 12345,
      'isNew': true,
    },
    props: {
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
      const token = context.auth.access_token;
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
  }
});
