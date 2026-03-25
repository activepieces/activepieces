import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { greenhouseAuth } from '../auth';
import { makeRequest } from '../common/client';
import { baseCreateProps, buildCreatePersonBody } from '../common/props';

export const createProspectAction = createAction({
  name: 'create_prospect',
  displayName: 'Create Prospect',
  description: 'Create a prospect in Greenhouse.',
  auth: greenhouseAuth,
  props: {
    ...baseCreateProps,
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, {
      method: HttpMethod.POST,
      path: '/prospects',
      onBehalfOfUserId: propsValue.userId,
      body: buildCreatePersonBody(propsValue),
    });
  },
});
