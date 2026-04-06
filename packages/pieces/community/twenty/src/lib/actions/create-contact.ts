import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { twentyAuth } from '../auth';
import { twentyRequest } from '../common';

export const createContact = createAction({
  auth: twentyAuth,
  name: 'create_contact',
  displayName: 'Create Contact',
  description: 'Creates a new person record in your Twenty CRM workspace.',
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
      required: false,
    }),
  },
  async run(context) {
    const { firstName, lastName, email } = context.propsValue;

    return await twentyRequest(
      context.auth,
      HttpMethod.POST,
      '/rest/people',
      {
        name: {
          firstName,
          lastName,
        },
        emails: email ? { primaryEmail: email } : undefined,
      },
    );
  },
});
