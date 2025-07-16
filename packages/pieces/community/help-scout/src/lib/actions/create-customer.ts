import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { helpScoutAuth } from '../common/auth';

export const createCustomer = createAction({
  name: 'create_customer',
  displayName: 'Create Customer',
  description: 'Add a new customer with full profile details.',
  auth: helpScoutAuth,
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
    }),
    jobTitle: Property.ShortText({
      displayName: 'Job Title',
      required: false,
    }),
    location: Property.ShortText({
      displayName: 'Location',
      required: false,
    }),
    background: Property.LongText({
      displayName: 'Background',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const body: any = {
      firstName: propsValue['firstName'],
      lastName: propsValue['lastName'],
      emails: [{ value: propsValue['email'] }],
      phones: propsValue['phone'] ? [{ value: propsValue['phone'] }] : [],
      jobTitle: propsValue['jobTitle'],
      location: propsValue['location'],
      background: propsValue['background'],
    };
    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: 'https://api.helpscout.net/v2/customers',
      headers: {
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
      },
      body,
    });
    return response.body;
  },
}); 