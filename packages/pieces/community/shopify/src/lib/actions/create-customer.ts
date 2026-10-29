import {
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { createCustomer } from '../common';

export const createCustomerAction = createAction({
  auth: shopifyAuth,
  name: 'create_customer',
  classification: 'WRITE',
  displayName: 'Create Customer',
  description: 'Create a new customer.',
  audience: 'both',
  aiMetadata: { description: 'Create a new Shopify customer record with email, name, phone, tags, and marketing consent. Pick this for a new contact; use Update Customer to edit an existing one. Each call creates a new record, so repeating it may produce duplicate customers.', idempotent: false },
  propertyGroups: [
    {
      key: 'contact',
      display: 'section',
      label: 'Contact',
      icon: 'user',
      props: ['firstName', 'lastName', 'email', 'phoneNumber'],
    },
    {
      key: 'account',
      display: 'section',
      label: 'Account',
      icon: 'inbox',
      props: ['verifiedEmail', 'sendEmailInvite', 'acceptsMarketing'],
    },
  ],
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      placeholder: 'jane@example.com',
      required: false,
      width: 'half',
    }),
    verifiedEmail: Property.Checkbox({
      displayName: 'Verified Email',
      description: 'Whether the customer has verified their email.',
      required: false,
      defaultValue: true,
    }),
    sendEmailInvite: Property.Checkbox({
      displayName: 'Send Email Invite',
      description: 'Email the customer an invite to create an account.',
      required: false,
      defaultValue: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
      width: 'half',
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
      width: 'half',
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Include the country code.',
      placeholder: '+15145550123',
      required: false,
      width: 'half',
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description: 'Separate tags with commas.',
      placeholder: 'sale, summer',
      required: false,
      advanced: true,
    }),
    acceptsMarketing: Property.Checkbox({
      displayName: 'Accepts Marketing',
      description: 'Subscribe the customer to email marketing.',
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
      acceptsMarketing
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
        email_marketing_consent:{
          state:acceptsMarketing?'subscribed':'not_subscribed',
          opt_in_level:"unknown"
        }
      },
      auth
    );
  },
});
