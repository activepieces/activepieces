import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { salesloftAuth } from '../auth';
import { salesloftRequest } from '../common/client';
import { personIdProp } from '../common/props';

export const getPersonAction = createAction({
  name: 'get_person',
  displayName: 'Get Person',
  description: 'Fetch a single person by ID from Salesloft.',
  audience: 'both',
  aiMetadata: {
    description:
      'Retrieves a single Salesloft person record by its numeric person ID. Use to look up a known contact\'s current details. Read-only and idempotent.',
    idempotent: true,
  },
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
