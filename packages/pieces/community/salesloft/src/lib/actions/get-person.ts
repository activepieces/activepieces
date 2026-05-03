import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { salesloftAuth } from '../auth';
import { salesloftRequest } from '../common/client';
import { personIdProp } from '../common/props';

export const getPersonAction = createAction({
  name: 'get_person',
  displayName: 'Get Person',
  description: 'Fetch a single person by ID from Salesloft.',
  auth: salesloftAuth,
  props: {
    person_id: personIdProp,
  },
  async run({ auth, propsValue }) {
    return salesloftRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      path: `/people/${encodeURIComponent(String(propsValue.person_id))}`,
    });
  },
});
