import { klaviyoAuth } from '../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, klaviyoCommon } from '../common';

export const unsubscribeProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_unsubscribe_profile',
  displayName: 'Unsubscribe Profile',
  description: 'Unsubscribe a profile from email or SMS marketing.',
  props: {
    listId: klaviyoCommon.listId(true),
    channel: Property.StaticDropdown({
      displayName: 'Channel',
      required: true,
      options: {
        disabled: false,
        options: [
          {
            label: 'Email',
            value: 'email',
          },
          {
            label: 'SMS',
            value: 'sms',
          },
        ],
      },
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
      description: 'Email address (required for email unsubscriptions)',
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
      description: 'Phone number in E.164 format (required for SMS unsubscriptions)',
    }),
  },
  async run(context) {
    const { listId, channel, email, phone_number } = context.propsValue;

    if (channel === 'email' && !email) {
      throw new Error('Email is required for email unsubscriptions');
    }

    if (channel === 'sms' && !phone_number) {
      throw new Error('Phone number is required for SMS unsubscriptions');
    }

    const client = makeClient(context.auth);
    return await client.unsubscribeProfiles(
      listId,
      [{ email, phone_number }],
      channel as 'email' | 'sms'
    );
  },
});

