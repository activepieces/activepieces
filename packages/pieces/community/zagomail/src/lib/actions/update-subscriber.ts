import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { zagomailAuth } from '../../index';

export const updateSubscriberAction = createAction({
  auth: zagomailAuth,
  name: 'update_subscriber',
  displayName: 'Update Subscriber',
  description: 'Update an existing subscriber',
  props: {
    subscriberId: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber to update',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'The first name of the subscriber',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'The last name of the subscriber',
      required: false,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description: 'The subscription status',
      required: false,
      options: {
        options: [
          { label: 'Subscribed', value: 'subscribed' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Bounced', value: 'bounced' },
          { label: 'Inactive', value: 'inactive' },
        ],
      },
    }),
    customFields: Property.Object({
      displayName: 'Custom Fields',
      description: 'Any custom fields to update for this subscriber',
      required: false,
    }),
  },
  async run({ propsValue, auth }) {
    const payload = {
      first_name: propsValue.firstName,
      last_name: propsValue.lastName,
      status: propsValue.status,
      custom_fields: propsValue.customFields,
    };

    // Remove undefined values
    Object.keys(payload).forEach(key => {
      if (payload[key] === undefined) {
        delete payload[key];
      }
    });

    return await makeRequest(
      auth as string,
      HttpMethod.PATCH,
      `/subscribers/${propsValue.subscriberId}`,
      payload
    );
  },
});
