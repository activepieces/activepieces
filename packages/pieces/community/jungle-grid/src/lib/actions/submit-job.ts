import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { jungleGridAuth } from '../auth';
import { jungleGridCommon } from '../common';

export const submitJob = createAction({
  auth: jungleGridAuth,
  name: 'submit_job',
  displayName: 'Submit Job',
  description:
    'Submit a Jungle Grid job and return immediately with job metadata. This action does not wait for completion.',
  props: {
    instructions: jungleGridCommon.asyncInstructions,
    ...jungleGridCommon.submitJobProps,
  },
  async run(context) {
    return await jungleGridCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      path: jungleGridCommon.endpoints.submitJob,
      body: jungleGridCommon.buildSubmitJobPayload(context.propsValue),
    });
  },
});
