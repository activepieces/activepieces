import { meistertaskAuth } from '../auth';
import { meisterTaskCommon, makeRequest } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findPerson = createAction({
  auth: meistertaskAuth,
  name: 'find_person',
  displayName: 'Find Person',
  description: 'Finds a person based on person_id',
  audience: 'both',
  aiMetadata: { description: 'Retrieve a single MeisterTask person (user) by their numeric person ID. Use to resolve a known ID into the person\'s details such as name and email. Read-only and idempotent; requires the exact person ID — it does not search by name.', idempotent: true },
  props: {
    person_id: Property.Number({
      displayName: 'Person ID',
      required: true,
    }),
  },
  async run(context) {
    const token = context.auth.access_token;
    const { person_id } = context.propsValue;

    const response = await makeRequest(
      HttpMethod.GET,
      `/persons/${person_id}`,
      token
    );

    return response.body;
  },
});