import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { savvyCalApiCall, flattenEvent, SavvyCalEvent } from '../common';
import { savvyCalAuth, getToken } from '../auth';

export const cancelEventAction = createAction({
  auth: savvyCalAuth,
  name: 'cancel_event',
  classification: 'DESTRUCTIVE',
  displayName: 'Cancel Event',
  description: 'Cancels a scheduled meeting in SavvyCal.',
  audience: 'both',
  aiMetadata: { description: 'Cancels a scheduled SavvyCal meeting identified by its event id, optionally with a cancellation reason. Use when a booking needs to be called off; obtain the event id from a trigger, List Events, or Get Event. Fails if the event is already canceled. Mutates state and is not idempotent.', idempotent: false },
  props: {
    event_id: Property.ShortText({
      displayName: 'Event ID',
      description: 'The unique ID of the event to cancel. You can find this from the output of a trigger or the List Events / Get Event actions.',
      required: true,
    }),
    cancel_reason: Property.LongText({
      displayName: 'Reason',
      description: 'Why the meeting is canceled. Saved on the event in SavvyCal.',
      required: false,
    }),
  },
  async run(context) {
    const { event_id, cancel_reason } = context.propsValue;
    const response = await savvyCalApiCall<SavvyCalEvent>({
      token: getToken(context.auth),
      method: HttpMethod.POST,
      path: `/events/${event_id}/cancel`,
      body: cancel_reason ? { cancel_reason } : undefined,
    });

    return {
      ...flattenEvent(response.body),
      success: true,
      event_id,
      message: 'Event cancelled successfully.',
    };
  },
});
