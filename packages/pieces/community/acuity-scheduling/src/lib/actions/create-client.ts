import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';
import { acuitySchedulingAuth } from '../../index';
import { API_URL } from '../common';

interface CreateClientProps {
  firstName: string;
  lastName: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export const createClient = createAction({
  auth: acuitySchedulingAuth,
  name: 'create_client',
  displayName: 'Create Client',
  description: 'Create a new client in your Acuity Scheduling client list.',
  props: {
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: "Client's first name.",
      required: true,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: "Client's last name.",
      required: true,
    }),
    phone: Property.ShortText({
      displayName: 'Phone',
      description: "Client's phone number.",
      required: false,
    }),
    email: Property.ShortText({
      displayName: 'Email',
      description: "Client's email address.",
      required: false,
    }),
    notes: Property.LongText({
      displayName: 'Notes',
      description: 'Notes about the client.',
      required: false,
    }),
  },
  async run(context) {
    const props = context.propsValue as CreateClientProps;
    const { username, password } = context.auth;

    const body: Record<string, unknown> = {
      firstName: props.firstName,
      lastName: props.lastName,
    };

    if (props.phone) body['phone'] = props.phone;
    if (props.email) body['email'] = props.email;
    if (props.notes) body['notes'] = props.notes;

    return await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${API_URL}/clients`,
      body,
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64'),
      },
    });
  },
});
