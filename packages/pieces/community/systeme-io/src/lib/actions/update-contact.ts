import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { systemeIoAuth } from '../common/auth';
import { systemeIoCommon } from '../common/client';
import { systemeIoProps } from '../common/props';

export const updateContact = createAction({
  auth: systemeIoAuth,
  name: 'updateContact',
  displayName: 'Update Contact',
  description: 'Update an existing contact',
  props: {
    contactId: systemeIoProps.contactIdDropdown,
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Contact email address',
      required: false,
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
  },
  async run(context) {
    const { contactId, email, firstName, lastName, phone } = context.propsValue;
    
    const updateData: any = {};
    if (email) updateData.email = email;
    if (firstName) updateData.first_name = firstName;
    if (lastName) updateData.last_name = lastName;
    if (phone) updateData.phone = phone;

    const response = await systemeIoCommon.apiCall({
      method: HttpMethod.PATCH,
      url: `/contacts/${contactId}`,
      body: updateData,
      auth: context.auth,
    });

    return response;
  },
});
