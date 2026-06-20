import { createAction } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const getEventType = createAction({
  auth: calendlyAuth,
  name: "get_event_type",
  displayName: "Get Event Type",
  description:
    "Get details for a Calendly event type, including scheduling_url and duration.",
  props: {
    event_type: calendlyCommon.eventTypeDropdown()
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const eventTypeUri = calendlyCommon.resolveEventTypeUri(
      context.propsValue.event_type
    );
    const eventTypeUuid = calendlyCommon.resolveUuid(eventTypeUri);

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.GET,
      path: `/event_types/${eventTypeUuid}`
    });
  }
});
