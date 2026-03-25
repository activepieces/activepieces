import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { replyIoAuth } from '../auth';
import { cleanPayload, replyIoRequest } from '../common/client';

export const createOrUpdateContactAction = createAction({
  name: 'create_or_update_contact',
  displayName: 'Create or Update Contact',
  description: 'Create a new contact or update it if it already exists in Reply.io.',
  auth: replyIoAuth,
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    company: Property.ShortText({
      displayName: 'Company',
      required: false,
    }),
    city: Property.ShortText({
      displayName: 'City',
      required: false,
    }),
    state: Property.ShortText({
      displayName: 'State',
      required: false,
    }),
    country: Property.ShortText({
      displayName: 'Country',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const response = await replyIoRequest({
      apiKey: auth.props.api_key,
      method: HttpMethod.POST,
      path: '/v1/people',
      body: cleanPayload({
        email: propsValue.email,
        firstName: propsValue.firstName,
        lastName: propsValue.lastName,
        company: propsValue.company,
        city: propsValue.city,
        state: propsValue.state,
        country: propsValue.country,
        title: propsValue.title,
        phone: propsValue.phone,
      }),
    });

    return response.body;
  },
});
