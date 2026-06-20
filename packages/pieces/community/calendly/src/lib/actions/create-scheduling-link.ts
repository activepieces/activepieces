import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const createSchedulingLink = createAction({
  auth: calendlyAuth,
  name: "create_scheduling_link",
  displayName: "Create Single-Use Scheduling Link",
  description:
    "Create a one-time scheduling link for an event type. Good for sending a private booking link that expires after one use.",
  props: {
    event_type: calendlyCommon.eventTypeDropdown()
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const owner = calendlyCommon.resolveEventTypeUri(
      context.propsValue.event_type
    );

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.POST,
      path: "/scheduling_links",
      body: {
        max_event_count: 1,
        owner,
        owner_type: "EventType"
      }
    });
  }
});
