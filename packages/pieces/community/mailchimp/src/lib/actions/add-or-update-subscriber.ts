import { createAction, Property } from '@activepieces/pieces-framework';
import { mailchimpCommon } from '../common';
import { mailchimpAuth } from '../..';

export const addOrUpdateSubscriber = createAction({
  auth: mailchimpAuth,
  name: 'add_or_update_subscriber',
  displayName: 'Add or Update Subscriber',
  description: 'Add a new subscriber or update an existing one in a Mailchimp audience',
  props: {
    list_id: mailchimpCommon.mailChimpListIdDropdown,
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The email address of the subscriber',
      required: true,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      required: true,
      options: {
        disabled: false,
        options: [
          { label: 'Subscribed', value: 'subscribed' },
          { label: 'Unsubscribed', value: 'unsubscribed' },
          { label: 'Cleaned', value: 'cleaned' },
          { label: 'Pending', value: 'pending' },
        ],
      },
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      description: 'First name of the subscriber',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      description: 'Last name of the subscriber',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number of the subscriber',
      required: false,
    }),
    address: Property.Object({
      displayName: 'Address',
      description: 'Address information for the subscriber',
      required: false,
      properties: {
        addr1: Property.ShortText({
          displayName: 'Address Line 1',
          required: false,
        }),
        addr2: Property.ShortText({
          displayName: 'Address Line 2',
          required: false,
        }),
        city: Property.ShortText({
          displayName: 'City',
          required: false,
        }),
        state: Property.ShortText({
          displayName: 'State/Province',
          required: false,
        }),
        zip: Property.ShortText({
          displayName: 'Postal Code',
          required: false,
        }),
        country: Property.ShortText({
          displayName: 'Country',
          required: false,
        }),
      },
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to apply to the subscriber',
      required: false,
    }),
  },
  async run(context) {
    try {
      const subscriberHash = mailchimpCommon.getMD5EmailHash(context.propsValue.email!);
      
      const mergeFields: any = {};
      if (context.propsValue.first_name) mergeFields.FNAME = context.propsValue.first_name;
      if (context.propsValue.last_name) mergeFields.LNAME = context.propsValue.last_name;
      if (context.propsValue.phone) mergeFields.PHONE = context.propsValue.phone;
      if (context.propsValue.address) mergeFields.ADDRESS = context.propsValue.address;

      const subscriberData = {
        email_address: context.propsValue.email,
        status_if_new: context.propsValue.status,
        status: context.propsValue.status,
        merge_fields: mergeFields,
      };

      const response = await mailchimpCommon.makeApiRequest(
        context.auth,
        `/lists/${context.propsValue.list_id}/members/${subscriberHash}`,
        'PUT' as any,
        subscriberData
      );

      // Add tags if provided
      if (context.propsValue.tags && context.propsValue.tags.length > 0) {
        const tagsData = {
          tags: context.propsValue.tags.map((tag: string) => ({ name: tag, status: 'active' })),
        };

        await mailchimpCommon.makeApiRequest(
          context.auth,
          `/lists/${context.propsValue.list_id}/members/${subscriberHash}/tags`,
          'POST' as any,
          tagsData
        );
      }

      return response.body;
    } catch (error) {
      throw new Error(`Failed to add or update subscriber: ${JSON.stringify(error)}`);
    }
  },
});
