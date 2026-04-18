import { Property, createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { lumaAuth } from '../auth';
import { lumaCommon } from '../common';

export const getEventAction = createAction({
  auth: lumaAuth,
  name: 'get-event',
  displayName: 'Get Event',
  description: 'Retrieve details of a Luma event',
  props: {
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'The event ID (starts with evt-) or the event URL slug',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    return lumaCommon.makeRequest({
      apiKey: auth,
      method: HttpMethod.GET,
      path: '/event/get',
      queryParams: { event_id: propsValue.event_id },
    });
  },
});
