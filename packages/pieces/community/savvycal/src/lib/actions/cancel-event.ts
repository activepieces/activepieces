import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall } from '../common';
import { savvyCalAuth } from '../../';

export const cancelEventAction = createAction({
  auth: savvyCalAuth,
  name: 'cancel_event',
  displayName: 'Cancel Event',
  description: 'Cancels a scheduled meeting in SavvyCal.',
  props: {
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'The unique ID of the event to cancel. You can find this from the output of a trigger or the List Events / Get Event actions.',
      required: true,
    }),
  },
  async run(context) {
    await savvyCalApiCall({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/events/${context.propsValue.event_id}/cancel`,
    });

    return {
      success: true,
      event_id: context.propsValue.event_id,
      message: 'Event cancelled successfully.',
    };
  },
});
