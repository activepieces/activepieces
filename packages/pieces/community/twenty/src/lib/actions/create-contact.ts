import { createAction, Property } from '@activepieces/pieces-framework';
import { twentyAuth } from '../auth';
import { twentyApi } from '../common/api';
import { createContactOutputSchema } from '../output-schemas';

export const createContactAction = createAction({
  auth: twentyAuth,
  name: 'create_contact',
  outputSchema: createContactOutputSchema,
  classification: 'WRITE',
  displayName: 'Create Contact',
  description: 'Creates a new person record in your Twenty CRM workspace.',
  audience: 'human',
  aiMetadata: { description: 'Creates a new person (contact) in Twenty CRM. Use when adding a known individual to the CRM; first name is required, last name and primary email are optional. Not idempotent: each call inserts a new record with no de-duplication, so repeated calls create duplicate people.', idempotent: false },
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

    return await twentyApi.createPerson({
      auth: context.auth,
      firstName,
      lastName,
      email,
    });
  },
});
