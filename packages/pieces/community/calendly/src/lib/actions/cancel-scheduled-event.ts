import { HttpMethod } from "@activepieces/pieces-common";
import { createAction, Property } from "@activepieces/pieces-framework";
import { calendlyAuth } from '../auth';
import { calendlyCommon } from '../common';

export const cancelScheduledEvent = createAction({
  auth: calendlyAuth,
  name: "cancel_event",
  displayName: "Cancel Scheduled Event",
  description: "Cancel a scheduled Calendly event.",
  props: {
    event_uuid: Property.ShortText({
      displayName: "Event UUID or URI",
      description:
        "The scheduled event UUID or full Calendly URI. Use the event URI from a trigger payload, not the invitee URI.",
      required: true
    }),
    reason: Property.LongText({
      displayName: "Cancellation Reason",
      description: "Optional reason shown in Calendly.",
      required: false
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const eventUuid = calendlyCommon.resolveUuid(context.propsValue.event_uuid);
    const reason = context.propsValue.reason as string | undefined;

    const body: Record<string, string> = {};
    if (reason?.trim()) {
      body.reason = reason.trim();
    }

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.POST,
      path: `/scheduled_events/${eventUuid}/cancellation`,
      body
    });
  }
});
