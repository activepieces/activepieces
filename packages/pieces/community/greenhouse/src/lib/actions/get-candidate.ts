import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { greenhouseAuth } from '../auth';
import { greenhouseRequest } from '../common/client';

export const getCandidateAction = createAction({
  name: 'get_candidate',
  displayName: 'Get Candidate',
  description: 'Retrieve a Greenhouse candidate by ID.',
  auth: greenhouseAuth,
  props: {
    candidateId: Property.Number({
      displayName: 'Candidate ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return greenhouseRequest({
      auth,
      method: HttpMethod.GET,
      path: `/candidates/${propsValue.candidateId}`,
    });
  },
});
