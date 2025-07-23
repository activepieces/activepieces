import { createAction, Property } from '@activepieces/pieces-framework';
import { BitlyAuth } from '../common/auth';
import { makeRequest } from '../common/client';
import { HttpMethod } from '@activepieces/pieces-common';

export const getBitlinkDetails = createAction({
  auth: BitlyAuth,
  name: 'getBitlinkDetails',
  displayName: 'Get Bitlink Details',
  description: 'Retrieve full metadata for a Bitlink by its ID or URL.',
  props: {
    bitlink_id: Property.ShortText({
      displayName: 'Bitlink ID',
      required: true,
      description: 'The Bitlink to retrieve (e.g., bit.ly/12a4b6c)',
    }),
  },
  async run({ auth, propsValue }) {
    const { bitlink_id } = propsValue;
    if (!bitlink_id) {
      throw new Error('Bitlink ID is required');
    }
    const response = await makeRequest(
      auth as string,
      HttpMethod.GET,
      `/bitlinks/${bitlink_id}`
    );
    return {
      success: true,
      message: `Bitlink details retrieved successfully.`,
      data: response,
    };
  },
});
