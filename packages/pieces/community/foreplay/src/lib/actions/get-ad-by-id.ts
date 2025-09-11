import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { ForeplayAuth } from '../common/auth';
import { makeRequest } from '../common/client';


export const getAdById = createAction({
  auth: ForeplayAuth,
  name: 'getAdById',
  displayName: 'Get Ad by ID',
  description:
    'Retrieve detailed information about a specific ad using its unique ID.',
  props: {
    adId: Property.ShortText({
      displayName: 'Ad ID',
      description: 'The unique identifier of the ad',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { adId } = propsValue;

    const response = await makeRequest(
      auth,
      HttpMethod.GET,
      `/ad/${encodeURIComponent(adId)}`
    );

    return response;
  },
});
