import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';

export const createContact = createAction({
  auth: systemeIoAuth,
  name: 'createContact',
  displayName: 'Create Contact',
  description: 'Create a brand new contact',
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Contact email address',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Contact first name',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Contact last name',
      required: false,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: 'Contact phone number',
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to assign to the contact',
      required: false,
    }),
  },
  async run(context) {
    const { email, firstName, lastName, phone, tags } = context.propsValue;
    
    const contactData: any = {
      email,
    };

    if (firstName) contactData.first_name = firstName;
    if (lastName) contactData.last_name = lastName;
    if (phone) contactData.phone = phone;
    if (tags && tags.length > 0) contactData.tags = tags;

    const response = await systemeIoCommon.apiCall({
      method: HttpMethod.POST,
      url: '/contacts',
      body: contactData,
      auth: context.auth,
    });

    return response;
  },
});
