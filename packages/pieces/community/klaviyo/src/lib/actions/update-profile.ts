import { createAction, Property } from '@activepieces/pieces-framework';
import { klaviyoAuth } from '../../';
import { klaviyoApiCall } from '../common/client';
import { KlaviyoProps } from '../common/props';
import { HttpMethod } from '@activepieces/pieces-common';

export const klaviyoUpdateProfile = createAction({
  auth: klaviyoAuth,
  name: 'klaviyo_update_profile',
  displayName: 'Update Profile',
  description: 'Update an existing profile in Klaviyo.',
  props: {
    profile_id: KlaviyoProps.profileId,
    email: KlaviyoProps.email,
    phone_number: KlaviyoProps.phoneNumber,
    first_name: KlaviyoProps.firstName,
    last_name: KlaviyoProps.lastName,
    title: Property.ShortText({ displayName: 'Title', required: false }),
    organization: Property.ShortText({ displayName: 'Organization', required: false }),
    city: Property.ShortText({ displayName: 'City', required: false }),
    region: Property.ShortText({ displayName: 'Region', required: false }),
    country: Property.ShortText({ displayName: 'Country', required: false }),
    zip: Property.ShortText({ displayName: 'Zip Code', required: false }),
  },
  async run(context) {
    const props = context.propsValue;
    const attributes: Record<string, unknown> = {};
    if (props.email) attributes.email = props.email;
    if (props.phone_number) attributes.phone_number = props.phone_number;
    if (props.first_name) attributes.first_name = props.first_name;
    if (props.last_name) attributes.last_name = props.last_name;
    if (props.title) attributes.title = props.title;
    if (props.organization) attributes.organization = props.organization;

    const location: Record<string, string> = {};
    if (props.city) location.city = props.city;
    if (props.region) location.region = props.region;
    if (props.country) location.country = props.country;
    if (props.zip) location.zip = props.zip;
    if (Object.keys(location).length > 0) attributes.location = location;

    return await klaviyoApiCall({
      apiKey: context.auth,
      method: HttpMethod.PATCH,
      path: `/profiles/${props.profile_id}`,
      body: {
        data: {
          type: 'profile',
          id: props.profile_id,
          attributes,
        },
      },
    });
  },
});
