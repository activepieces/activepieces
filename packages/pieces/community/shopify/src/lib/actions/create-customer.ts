import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createCustomer } from '../common';

export const createCustomerAction = createAction({
  auth: shopifyAuth,
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Create a new customer.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    verifiedEmail: Property.Checkbox({
      displayName: 'Verified Email',
      description: 'Whether the customer has verified their email.',
      required: false,
      defaultValue: true,
    }),
    sendEmailInvite: Property.Checkbox({
      displayName: 'Send Email Invite',
      required: false,
      defaultValue: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'A string of comma-separated tags for filtering and search',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      email,
      verifiedEmail,
      sendEmailInvite,
      firstName,
      lastName,
      phoneNumber,
      tags,
    } = propsValue;

    return await createCustomer(
      {
        email,
        verified_email: verifiedEmail,
        send_email_invite: sendEmailInvite,
        first_name: firstName,
        last_name: lastName,
        phone: phoneNumber,
        tags,
      },
      auth
    );
  },
});
