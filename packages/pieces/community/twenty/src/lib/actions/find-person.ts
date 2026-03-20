import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { twentyAuth } from '../auth';
import { twentyRequest, parseRecords } from '../common';

export const findPerson = createAction({
  auth: twentyAuth,
  name: 'find_person',
  displayName: 'Find Person',
  description: 'Searches for person records in Twenty CRM.',
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
    const queryParams: Record<string, string> = {};

    if (email) {
      queryParams['filter[emails][primaryEmail][eq]'] = email;
    }
    if (firstName) {
      queryParams['filter[name][firstName][eq]'] = firstName;
    }
    if (lastName) {
      queryParams['filter[name][lastName][eq]'] = lastName;
    }

    const body = await twentyRequest(
      context.auth,
      HttpMethod.GET,
      '/rest/people',
      undefined,
      queryParams,
    );

    return parseRecords(body);
  },
});
