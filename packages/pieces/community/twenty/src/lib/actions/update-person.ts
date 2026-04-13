import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { twentyAuth } from '../auth';
import { twentyRequest, parseSingleRecord } from '../common';

export const updatePerson = createAction({
  auth: twentyAuth,
  name: 'update_person',
  displayName: 'Update Person',
  description: 'Updates an existing person record in Twenty CRM.',
  props: {
    personId: Property.ShortText({
      displayName: 'Person ID',
      description: 'The ID of the person to update. Use the "Find Person" action to look this up.',
      required: true,
    }),
    firstName: Property.ShortText({
      displayName: 'First Name',
      required: false,
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
    const { personId, firstName, lastName, email } = context.propsValue;

    const body: Record<string, unknown> = {};
    if (firstName || lastName) {
      const existing = await twentyRequest<Record<string, unknown>>(
        context.auth,
        HttpMethod.GET,
        `/rest/people/${personId}`,
      );
      const personData = parseSingleRecord(existing);
      const existingName = (personData['name'] as Record<string, string>) ?? {};
      body['name'] = {
        firstName: firstName ?? existingName['firstName'],
        lastName: lastName ?? existingName['lastName'],
      };
    }
    if (email) {
      body['emails'] = { primaryEmail: email };
    }

    if (Object.keys(body).length === 0) {
      return await twentyRequest(
        context.auth,
        HttpMethod.GET,
        `/rest/people/${personId}`,
      );
    }

    return await twentyRequest(
      context.auth,
      HttpMethod.PATCH,
      `/rest/people/${personId}`,
      body,
    );
  },
});
