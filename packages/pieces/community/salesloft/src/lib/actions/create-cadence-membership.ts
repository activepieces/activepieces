import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { salesloftAuth } from '../auth';
import { cleanPayload, salesloftRequest } from '../common/client';
import { cadenceIdProp, personIdProp, userIdProp } from '../common/props';

export const createCadenceMembershipAction = createAction({
  name: 'create_cadence_membership',
  displayName: 'Add Person to Cadence',
  description:
    'Add a person to a cadence. The person and cadence must be visible to the authenticated user.',
  auth: salesloftAuth,
  props: {
    person_id: personIdProp,
    cadence_id: cadenceIdProp,
    user_id: userIdProp,
  },
  async run({ auth, propsValue }) {
    const body = cleanPayload({
      person_id: Number(propsValue.person_id),
      cadence_id: Number(propsValue.cadence_id),
      user_id: propsValue.user_id
        ? Number(propsValue.user_id)
        : undefined,
    });

    return salesloftRequest({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      path: '/cadence_memberships',
      body,
    });
  },
});
