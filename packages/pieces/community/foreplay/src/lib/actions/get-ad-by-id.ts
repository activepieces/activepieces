import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { makeRequest } from '../common/client';
import { ForeplayAuth } from '../common/auth';



export const getAdById = createAction({
  auth: ForeplayAuth,
  name: 'get_ad_by_id',
  displayName: 'Get Ad by ID',
  description: 'Retrieve detailed information about a specific ad using its unique ID.',
  props: {
    adId: Property.ShortText({
      displayName: 'Ad ID',
      description: 'The unique identifier of the ad to retrieve',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { adId } = propsValue;

    if (!adId) {
      throw new Error("Ad ID is required");
    }

    const response = await makeRequest(
      auth,
      HttpMethod.GET,
      `/ad/${encodeURIComponent(adId)}`
    );

    return response;
  },
});
