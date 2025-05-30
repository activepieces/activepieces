import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAcuityRequest, fetchClients } from '../common';
import { acuityAuth } from '../../index';
import { clientFirstNameDropdown, clientLastNameDropdown, clientPhoneDropdown } from '../common/props';

export const updateClient = createAction({
  name: 'update_client',
  displayName: 'Update Client',
  description: 'Update an existing client in Acuity Scheduling by specifying lookup info and new details.',
  auth: acuityAuth,
  props: {
    queryFirstName: clientFirstNameDropdown,
    queryLastName: clientLastNameDropdown,
    queryPhone: clientPhoneDropdown,
    firstName: Property.ShortText({
      displayName: 'New First Name',
      required: true,
      description: 'Updated first name of the client',
    }),
    lastName: Property.ShortText({
      displayName: 'New Last Name',
      required: true,
      description: 'Updated last name of the client',
    }),
    phone: Property.ShortText({
      displayName: 'New Phone',
      required: false,
      description: 'Updated phone number of the client',
    }),
    email: Property.ShortText({
      displayName: 'New Email',
      required: false,
      description: 'Updated email address of the client',
    }),
    notes: Property.LongText({
      displayName: 'New Notes',
      required: false,
      description: 'Updated notes about the client',
    }),
  },
  async run(context) {
    const queryParams: Record<string, string> = {
      firstName: context.propsValue.queryFirstName,
      lastName: context.propsValue.queryLastName,
    };
    if (context.propsValue.queryPhone) {
      queryParams['phone'] = context.propsValue.queryPhone;
    }

    const body = {
      firstName: context.propsValue.firstName,
      lastName: context.propsValue.lastName,
      phone: context.propsValue.phone,
      email: context.propsValue.email,
      notes: context.propsValue.notes,
    };

    return await makeAcuityRequest(
      context.auth,
      HttpMethod.PUT,
      '/clients',
      body,
      queryParams
    );
  },
});
