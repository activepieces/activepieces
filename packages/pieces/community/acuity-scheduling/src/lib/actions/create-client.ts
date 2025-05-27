import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeAcuityRequest } from '../common';
import { acuityAuth } from '../../index';

export const createClient = createAction({
  name: 'create_client',
  displayName: 'Create Client',
  description: 'Create a new client in Acuity Scheduling.',
  auth: acuityAuth,
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: true,
      description: "Client's first name.",
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      required: true,
      description: "Client's last name.",
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      required: false,
      description: "Client's phone number.",
    }),
    email: Property.ShortText({
      displayName: 'Email',
      required: false,
      description: "Client's email address (e.g., client@example.com).",
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      required: false,
      description: 'Additional notes about the client.',
    }),
  },
  async run(context) {
    const body = {
      firstName: context.propsValue.firstName,
      lastName: context.propsValue.lastName,
      phone: context.propsValue.phone,
      email: context.propsValue.email,
      notes: context.propsValue.notes,
    };

    return await makeAcuityRequest(
      context.auth,
      HttpMethod.POST,
      '/clients',
      body
    );
  },
});
