import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../index';
import { klaviyoApiRequest, KlaviyoProfile } from '../common';
import { HttpMethod } from '@activepieces/pieces-common';

export const createProfileAction = createAction({
  auth: klaviyoAuth,
  name: 'create-profile',
  displayName: 'Create Profile',
  description: 'Create a new profile in Klaviyo, optionally subscribing to email/SMS',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Email address of the profile',
      required: false,
    }),
    phone_number: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g., +12345678901)',
      required: false,
    }),
    external_id: Property.ShortText({
      displayName: 'External ID',
      description: 'A unique identifier used by customers to associate Klaviyo profiles with profiles in an external system',
      required: false,
    }),
    first_name: Property.ShortText({
      displayName: 'First Name',
      required: false,
    }),
    last_name: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    organization: Property.ShortText({
      displayName: 'Organization',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    image: Property.ShortText({
      displayName: 'Image URL',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    region: Property.ShortText({
      displayName: 'Region/State',
      required: false,
    }),
    zip: Property.ShortText({
      displayName: 'Zip/Postal Code',
      required: false,
    }),
    subscribe_to_email: Property.Checkbox({
      displayName: 'Subscribe to Email Marketing',
      description: 'Subscribe this profile to email marketing',
      required: false,
      defaultValue: false,
    }),
    subscribe_to_sms: Property.Checkbox({
      displayName: 'Subscribe to SMS Marketing',
      description: 'Subscribe this profile to SMS marketing',
      required: false,
      defaultValue: false,
    }),
    list_id: Property.ShortText({
      displayName: 'List ID',
      description: 'Optional: ID of a list to add the profile to',
      required: false,
    }),
  },
  async run(context) {
    const {
      email,
      phone_number,
      external_id,
      first_name,
      last_name,
      organization,
      title,
      image,
      city,
      country,
      region,
      zip,
      subscribe_to_email,
      subscribe_to_sms,
      list_id,
    } = context.propsValue;

    if (!email && !phone_number && !external_id) {
      throw new Error('At least one of email, phone_number, or external_id is required');
    }

    const profile: KlaviyoProfile = {
      type: 'profile',
      attributes: {
        email,
        phone_number,
        external_id,
        first_name,
        last_name,
        organization,
        title,
        image,
      },
    };

    // Add location if any location fields are provided
    if (city || country || region || zip) {
      profile.attributes.location = {
        city,
        country,
        region,
        zip,
      };
    }

    const requestBody: any = {
      data: profile,
    };

    // Add subscriptions if requested
    if (subscribe_to_email || subscribe_to_sms) {
      requestBody.data.attributes.subscriptions = {
        email: subscribe_to_email ? { marketing: { consent: 'SUBSCRIBED' } } : undefined,
        sms: subscribe_to_sms ? { marketing: { consent: 'SUBSCRIBED' } } : undefined,
      };
    }

    const response = await klaviyoApiRequest(
      context.auth,
      HttpMethod.POST,
      '/profiles/',
      requestBody
    );

    // If list_id is provided, add profile to list
    if (list_id && response.data?.id) {
      const addToListBody = {
        data: [
          {
            type: 'profile',
            id: response.data.id,
          },
        ],
      };

      await klaviyoApiRequest(
        context.auth,
        HttpMethod.POST,
        `/lists/${list_id}/relationships/profiles/`,
        addToListBody
      );
    }

    return response;
  },
});
