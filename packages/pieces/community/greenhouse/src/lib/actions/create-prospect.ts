import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';

import { greenhouseAuth } from '../auth';
import { compactObject, makeRequest } from '../common';
import { buildCommonPersonBody, commonPersonProps, jobIdsProp } from '../common/props';

export const createProspectAction = createAction({
  name: 'create_prospect',
  displayName: 'Create Prospect',
  description:
    'Create a prospect in Greenhouse. Greenhouse prospects can be created without a job, or attached to one or more jobs.',
  auth: greenhouseAuth,
  props: {
    ...commonPersonProps,
    jobIds: jobIdsProp,
  },
  async run({ auth, propsValue }) {
    const jobIds = ((propsValue.jobIds ?? []) as Array<string | number>).map((jobId) => Number(jobId));

    return makeRequest(auth, {
      method: HttpMethod.POST,
      path: '/prospects',
      onBehalfOfUserId: propsValue.userId,
      body: compactObject({
        ...buildCommonPersonBody(propsValue),
        ...(jobIds.length > 0
          ? {
              application: {
                job_ids: jobIds,
              },
            }
          : {}),
      }),
    });
  },
});
