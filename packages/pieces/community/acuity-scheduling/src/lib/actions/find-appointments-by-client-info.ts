import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAcuityRequest } from '../common';
import { acuityAuth } from '../../index';

export const findAppointmentsByClientInfo = createAction({
  name: 'findAppointmentsByClient',
  displayName: 'Find Appointments by Client Info',
  description: 'Retrieve appointments for a client using their information.',
  auth: acuityAuth,
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
      description: "Client's first name.",
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: false,
      description: "Client's last name.",
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
      description: "Client's email address.",
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
      description: "Client's phone number.",
    }),
  },
  async run(context) {
    const { firstName, lastName, email, phone } = context.propsValue;
    const queryParams: Record<string, string> = {};

    if (firstName) queryParams['firstName'] = firstName;
    if (lastName) queryParams['lastName'] = lastName;
    if (email) queryParams['email'] = email;
    if (phone) queryParams['phone'] = phone;

    const appointments = await makeAcuityRequest(
      context.auth,
      HttpMethod.GET,
      '/appointments',
      undefined,
      queryParams
    );

    return appointments;
  },
});
