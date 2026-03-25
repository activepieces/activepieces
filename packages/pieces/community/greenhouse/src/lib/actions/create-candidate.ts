import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { greenhouseAuth } from '../auth';
import { compactObject, makeRequest } from '../common';
import { buildCommonPersonBody, commonPersonProps, jobIdProp } from '../common/props';

export const createCandidateAction = createAction({
  name: 'create_candidate',
  displayName: 'Create Candidate',
  description: 'Create a candidate in Greenhouse with an initial application.',
  auth: greenhouseAuth,
  props: {
    ...commonPersonProps,
    jobId: jobIdProp,
  },
  async run({ auth, propsValue }) {
    return makeRequest(auth, {
      method: HttpMethod.POST,
      path: '/candidates',
      onBehalfOfUserId: propsValue.userId,
      body: compactObject({
        ...buildCommonPersonBody(propsValue),
        applications: [
          {
            job_id: Number(propsValue.jobId),
          },
        ],
      }),
    });
  },
});
