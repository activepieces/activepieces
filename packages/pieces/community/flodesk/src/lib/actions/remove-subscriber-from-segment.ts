import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { flodeskAuth } from '../auth';
import { flodeskApiCall, flodeskCommon } from '../common';

export const removeSubscriberFromSegmentAction = createAction({
  auth: flodeskAuth,
  name: 'remove_subscriber_from_segment',
  displayName: 'Remove Subscriber from Segment',
  description: 'Remove an existing subscriber from one or more segments.',
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
      method: HttpMethod.DELETE,
      endpoint: `/subscribers/${encodeURIComponent(props.email)}/segments`,
      body: {
        segment_ids: props.segments,
      },
    });

    return response;
  },
});
