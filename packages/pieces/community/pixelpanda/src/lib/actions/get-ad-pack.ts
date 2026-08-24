import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { pixelpandaAuth } from '../auth';
import { pixelpandaRequest } from '../common';

export const pixelpandaGetAdPackAction = createAction({
  auth: pixelpandaAuth,
  name: 'pixelpanda_get_ad_pack',
  displayName: 'Get Ad Pack',
  description: 'Fetch an ad pack job with its photos, video, static ads and captions',
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
      `/ad-pack/${propsValue.jobId}`,
      undefined,
    );
  },
});
