import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { flodeskAuth } from '../auth';
import { flodeskApiCall, flodeskCommon } from '../common';

export const addSubscriberToSegmentAction = createAction({
  auth: flodeskAuth,
  name: 'add_subscriber_to_segment',
  displayName: 'Add Subscriber to Segment',
  description: 'Add an existing subscriber to one or more segments.',
  props: {
    email: Property.ShortText({
      displayName: 'Subscriber Email',
      required: true,
    }),
    segments: flodeskCommon.segments_multi(true),
  },
  async run(context) {
    const props = context.propsValue;

    const response = await flodeskApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      endpoint: `/subscribers/${encodeURIComponent(props.email)}/segments`,
      body: {
        segment_ids: props.segments,
      },
    });

    return response;
  },
});
