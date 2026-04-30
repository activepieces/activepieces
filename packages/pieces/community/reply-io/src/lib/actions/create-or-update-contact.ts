import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { cleanPayload, replyIoRequest } from '../common/client';

export const createOrUpdateContactAction = createAction({
  name: 'create_or_update_contact',
  displayName: 'Create or Update Contact',
  description:
    'Add a new contact to Reply.io, or update their details if a contact with that email already exists.',
  auth: replyIoAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email Address',
      description: 'The contact\'s email address. Used to identify and deduplicate contacts.',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Contact\'s first name.',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Contact\'s last name.',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      description: 'The company or organisation the contact works for.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Job Title',
      description: 'Contact\'s job title, e.g. "VP of Sales" or "Marketing Manager".',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone Number',
      description: 'Contact\'s phone number.',
      required: false,
    }),
    linkedInProfile: Property.ShortText({
      displayName: 'LinkedIn Profile URL',
      description: 'Full URL to the contact\'s LinkedIn profile, e.g. https://linkedin.com/in/janedoe',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      description: 'City the contact is based in.',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State / Province',
      description: 'State or province the contact is based in.',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      description: 'Country the contact is based in.',
      required: false,
    }),
    timeZoneId: Property.ShortText({
      displayName: 'Time Zone',
      description:
        'IANA time zone name used to schedule emails at the right local time, e.g. "America/New_York" or "Europe/London".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await replyIoRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/v1/people',
      body: cleanPayload({
        email: propsValue.email,
        firstName: propsValue.firstName,
        lastName: propsValue.lastName,
        company: propsValue.company,
        title: propsValue.title,
        phone: propsValue.phone,
        linkedInProfile: propsValue.linkedInProfile,
        city: propsValue.city,
        state: propsValue.state,
        country: propsValue.country,
        timeZoneId: propsValue.timeZoneId,
      }),
    });

    return response.body;
  },
});
