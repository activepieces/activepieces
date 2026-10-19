import {
  MarkdownVariant,
  Property,
  createAction,
} from '@activepieces/pieces-framework';
import { shopifyAuth } from '../..';
import { updateCustomer } from '../common';
import * as z from 'zod/mini'
import { propsValidation } from '@activepieces/pieces-common';

export const updateCustomerAction = createAction({
  auth: shopifyAuth,
  name: 'update_customer',
  classification: 'WRITE',
  displayName: 'Update Customer',
  description: 'Update an existing customer.',
  audience: 'both',
  aiMetadata: { description: 'Update fields on an existing Shopify customer identified by customer ID (email, name, phone, tags, marketing consent). Pick this to edit a known customer rather than Create Customer; the customer ID is required and only supplied fields are changed. Sets absolute field values, so re-running with the same input is idempotent.', idempotent: true },
  propertyGroups: [
    {
      key: 'customer',
      display: 'section',
      label: 'Customer to update',
      icon: 'user',
      props: ['customerId'],
    },
    {
      key: 'changes',
      display: 'section',
      label: 'Changes',
      icon: 'sliders',
      props: [
        'changes_info',
        'firstName',
        'lastName',
        'email',
        'phoneNumber',
        'tags',
      ],
    },
    {
      key: 'account',
      display: 'section',
      label: 'Account',
      icon: 'inbox',
      props: [
        'account_warning',
        'verifiedEmail',
        'sendEmailInvite',
        'acceptsMarketing',
      ],
    },
  ],
  props: {
    customerId: Property.ShortText({
      displayName: 'Customer ID',
      description: "The number at the end of the customer's URL in Shopify admin.",
      placeholder: '1234567890',
      required: true,
    }),
    changes_info: Property.MarkDown({
      value: 'Empty fields keep their current value.',
    }),
    email: Property.ShortText({
      displayName: 'Email',
      placeholder: 'jane@example.com',
      required: false,
      width: 'half',
    }),
    account_warning: Property.MarkDown({
      value: 'These three are always sent. Leaving Accepts Marketing off unsubscribes the customer.',
      variant: MarkdownVariant.WARNING,
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
      description: 'Replaces the current tags. Separate them with commas.',
      placeholder: 'sale, summer',
      required: false,
    }),
    acceptsMarketing: Property.Checkbox({
      displayName: 'Accepts Marketing',
      description: 'Off unsubscribes the customer from email marketing.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const {
      customerId,
      email,
      verifiedEmail,
      sendEmailInvite,
      firstName,
      lastName,
      phoneNumber,
      tags,
      acceptsMarketing
    } = propsValue;

    await propsValidation.validateZod(propsValue, {
      email: z.optional(z.string().check(z.email())),
    });

    return await updateCustomer(
      customerId,
      {
        email,
        verified_email: verifiedEmail,
        send_email_invite: sendEmailInvite,
        first_name: firstName,
        last_name: lastName,
        phone: phoneNumber,
        tags,
           email_marketing_consent:{
          state:acceptsMarketing?'subscribed':'unsubscribed',
          opt_in_level:"unknown"
        }
      },
      auth
    );
  },
});
