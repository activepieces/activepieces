import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { vibeProspectingAuth } from '../auth';
import { exploriumApiCall, resolveApiKey } from '../common';

export const enrichFirmographics = createAction({
  auth: vibeProspectingAuth,
  name: 'enrich_firmographics',
  displayName: 'Enrich Firmographics',
  description: 'Enrich a business with firmographic attributes by business ID',
  props: {
    business_id: Property.ShortText({
      displayName: 'Business ID',
      description: 'Explorium business_id (32-character hex string)',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return exploriumApiCall({
      apiKey: resolveApiKey(auth),
      method: HttpMethod.POST,
      path: '/v1/businesses/firmographics/enrich',
      body: {
        business_id: propsValue.business_id,
      },
    });
  },
});
