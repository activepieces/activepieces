import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { klaviyoAuth } from '../../index';
import { klaviyoApiCall } from '../../common';

export const findProfileByEmailOrPhone = createAction({
  name: 'find_profile_by_email_or_phone',
  auth: klaviyoAuth,
  displayName: 'Find Profile by Email/Phone',
  description: 'Locate a profile using email or phone number.',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
    }),
    phoneNumber: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Phone number in E.164 format (e.g. +15551234567)',
      required: false,
    }),
  },
  async run(context) {
    const { email, phoneNumber } = context.propsValue;

    let filterParts: string[] = [];
    if (email) filterParts.push(`equals(email,"${email}")`);
    if (phoneNumber) filterParts.push(`equals(phone_number,"${phoneNumber}")`);

    const filter = filterParts.length > 1
      ? `or(${filterParts.join(',')})`
      : filterParts[0];

    if (!filter) {
      throw new Error('Please provide at least an email or phone number.');
    }

    const response = await klaviyoApiCall(
      HttpMethod.GET,
      'profiles',
      context.auth.secret_text,
      undefined,
      { filter }
    );
    return response.body;
  },
});
