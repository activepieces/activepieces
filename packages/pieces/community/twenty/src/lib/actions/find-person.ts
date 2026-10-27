import { createAction, Property } from '@activepieces/pieces-framework';
import { twentyAuth } from '../auth';
import { twentyApi } from '../common/api';
import { findPersonOutputSchema } from '../output-schemas';

export const findPersonAction = createAction({
  auth: twentyAuth,
  name: 'find_person',
  outputSchema: findPersonOutputSchema,
  classification: 'SEARCH',
  displayName: 'Find Person',
  description: 'Searches for person records in Twenty CRM.',
  audience: 'human',
  aiMetadata: { description: 'Looks up person records in Twenty CRM, optionally filtering by an exact-match email, first name, and/or last name. Use to resolve a person to their record ID before updating, or to check existence; leaving all filters empty returns all people. Idempotent: a read-only query with no side effects.', idempotent: true },
  props: {
    email: Property.ShortText({
      displayName: 'Email',
      description: 'Filter by email address.',
      required: false,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      description: 'Filter by first name.',
      required: false,
    }),
    lastName: Property.ShortText({
      displayName: 'Last Name',
      description: 'Filter by last name.',
      required: false,
    }),
  },
  async run(context) {
    const { email, firstName, lastName } = context.propsValue;

    return await twentyApi.findPeople({
      auth: context.auth,
      email,
      firstName,
      lastName,
    });
  },
});
