import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pixelpandaAuth } from '../auth';
import { pixelpandaRequest } from '../common';

export const pixelpandaGetVideoJobAction = createAction({
  auth: pixelpandaAuth,
  name: 'pixelpanda_get_video_job',
  displayName: 'Get Video Job',
  description: 'Fetch a UGC video job and its finished video URL',
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
      `/jobs/video/${propsValue.jobId}`,
      undefined,
    );
  },
});
