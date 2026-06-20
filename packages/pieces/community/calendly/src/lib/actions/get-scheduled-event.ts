import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const getScheduledEvent = createAction({
  auth: calendlyAuth,
  name: "get_event",
  displayName: "Get Scheduled Event",
  description: "Get details for a scheduled Calendly event by UUID or URI.",
  props: {
    event_uuid: Property.ShortText({
      displayName: "Event UUID or URI",
      description:
        'The event UUID or full Calendly URI (e.g. "https://api.calendly.com/scheduled_events/abc123").',
      required: true
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const eventUuid = calendlyCommon.resolveUuid(context.propsValue.event_uuid);

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.GET,
      path: `/scheduled_events/${eventUuid}`
    });
  }
});
