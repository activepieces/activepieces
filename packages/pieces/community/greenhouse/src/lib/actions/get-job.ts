import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';

import { greenhouseAuth } from '../auth';
import { greenhouseRequest } from '../common/client';

export const getJobAction = createAction({
  name: 'get_job',
  displayName: 'Get Job',
  description: 'Retrieve a Greenhouse job by ID.',
  auth: greenhouseAuth,
  props: {
    jobId: Property.Number({
      displayName: 'Job ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return greenhouseRequest({
      auth,
      method: HttpMethod.GET,
      path: `/jobs/${propsValue.jobId}`,
    });
  },
});
