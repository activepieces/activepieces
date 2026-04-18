import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { flodeskAuth } from '../..';

const BASE_URL = 'https://api.flodesk.com/v1';

export const addSubscriberToSegments = createAction({
  auth: flodeskAuth,
  name: 'add_subscriber_to_segments',
  displayName: 'Add Subscriber To Segments',
  description:
    'Add a subscriber to one or more segments in Flodesk. [See the documentation](https://developers.flodesk.com/#tag/subscriber/operation/addSubscriberToSegments)',
  props: {
    subscriber_id: Property.ShortText({
      displayName: 'Subscriber ID',
      description: 'The ID of the subscriber to add to segments',
      required: true,
    }),
    segment_ids: Property.Array({
      displayName: 'Segment IDs',
      description: 'Array of segment IDs to add the subscriber to',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { subscriber_id, segment_ids } = propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${BASE_URL}/subscribers/${subscriber_id}/segments`,
      headers: {
        Authorization: `Bearer ${auth}`,
        'Content-Type': 'application/json',
      },
      body: {
        segment_ids,
      },
    });

    return response.body;
  },
});
