import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pixelpandaAuth } from '../auth';
import { pixelpandaRequest } from '../common';

export const pixelpandaGetJobAction = createAction({
  auth: pixelpandaAuth,
  name: 'pixelpanda_get_job',
  displayName: 'Get Generation Job',
  description: 'Fetch a product-photo generation job and its result image URLs',
  props: {
    jobId: Property.ShortText({
      displayName: 'Job ID',
      required: true,
    })
  },
  async run({ auth, propsValue }) {
    return await pixelpandaRequest(
      { secret_text: auth.secret_text },
      HttpMethod.GET,
      `/jobs/${propsValue.jobId}`,
      undefined,
    );
  },
});
