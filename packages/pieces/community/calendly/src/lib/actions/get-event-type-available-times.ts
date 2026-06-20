import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const getEventTypeAvailableTimes = createAction({
  auth: calendlyAuth,
  name: "get_available_times",
  displayName: "Get Available Times",
  description:
    "List bookable time slots for an event type (max 7-day range per Calendly API).",
  props: {
    event_type: calendlyCommon.eventTypeDropdown(),
    start_time: Property.DateTime({
      displayName: "Range Start",
      description: "Start of the availability window (UTC).",
      required: true
    }),
    end_time: Property.DateTime({
      displayName: "Range End",
      description:
        "End of the availability window (UTC). Max 7 days after start.",
      required: true
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const eventTypeUri = calendlyCommon.resolveEventTypeUri(
      context.propsValue.event_type
    );

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.GET,
      path: "/event_type_available_times",
      queryParams: {
        event_type: eventTypeUri,
        start_time: new Date(
          context.propsValue.start_time as string
        ).toISOString(),
        end_time: new Date(context.propsValue.end_time as string).toISOString()
      }
    });
  }
});
