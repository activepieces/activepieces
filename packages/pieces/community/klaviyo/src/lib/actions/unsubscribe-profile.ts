import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest, listListsForDropdown } from '../common';

export const unsubscribeProfile = createAction({
  auth: klaviyoAuth,
  name: 'unsubscribe_profile',
  displayName: 'Unsubscribe Profile',
  description: 'Unsubscribe a profile from email or SMS on a specific list.',
  props: {
    listId: Property.Dropdown({
      displayName: 'List',
      description: 'The list to unsubscribe the profile from.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            placeholder: 'Connect your Klaviyo account first.',
            options: [],
          };
        }
        const options = await listListsForDropdown(auth as string);
        return { disabled: false, options };
      },
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format.',
      required: false,
    }),
    channels: Property.StaticMultiSelectDropdown({
      displayName: 'Channels',
      description: 'Channels to unsubscribe from.',
      required: true,
      options: {
        options: [
          { label: 'Email', value: 'EMAIL' },
          { label: 'SMS', value: 'SMS' },
        ],
      },
    }),
  },
  async run(context) {
    const { listId, email, phoneNumber, channels } = context.propsValue;

    if (!email && !phoneNumber) {
      throw new Error('Either email or phone number is required.');
    }

    const profile: Record<string, unknown> = {};
    if (email) profile['email'] = email;
    if (phoneNumber) profile['phone_number'] = phoneNumber;

    const subscriptions: Record<string, { marketing: { consent: string } }> = {};
    for (const channel of channels) {
      subscriptions[channel.toLowerCase()] = {
        marketing: { consent: 'UNSUBSCRIBED' },
      };
    }

    return klaviyoApiRequest(
      context.auth as string,
      HttpMethod.POST,
      '/profile-subscription-bulk-delete-jobs',
      {
        data: {
          type: 'profile-subscription-bulk-delete-job',
          attributes: {
            profiles: {
              data: [
                {
                  type: 'profile',
                  attributes: {
                    ...profile,
                    subscriptions,
                  },
                },
              ],
            },
          },
          relationships: {
            list: {
              data: { type: 'list', id: listId },
            },
          },
        },
      },
    );
  },
});
