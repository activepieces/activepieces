import { klaviyoAuth } from '../..';
import { Property, createAction } from '@activepieces/pieces-framework';
import { makeClient, klaviyoCommon } from '../common';

export const subscribeProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_subscribe_profile',
  displayName: 'Subscribe Profile',
  description: 'Subscribe a profile to email or SMS marketing.',
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
      description: 'Email address (required for email subscriptions)',
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      required: false,
      description: 'Phone number in E.164 format (required for SMS subscriptions)',
    }),
  },
  async run(context) {
    const { listId, channel, email, phone_number } = context.propsValue;

    if (channel === 'email' && !email) {
      throw new Error('Email is required for email subscriptions');
    }

    if (channel === 'sms' && !phone_number) {
      throw new Error('Phone number is required for SMS subscriptions');
    }

    const client = makeClient(context.auth);
    return await client.subscribeProfiles(
      listId,
      [{ email, phone_number }],
      channel as 'email' | 'sms'
    );
  },
});

