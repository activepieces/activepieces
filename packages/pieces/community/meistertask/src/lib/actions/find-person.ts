import { meistertaskAuth } from '../../index';
import { meisterTaskCommon, makeRequest } from '../common/common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';

export const findPerson = createAction({
  auth: meistertaskAuth,
  name: 'find_person',
  displayName: 'Find Person',
  description: 'Finds a person based on person_id',
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