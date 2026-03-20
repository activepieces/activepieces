import { createAction, Property } from "@activepieces/pieces-framework";
import { deleteEvent } from "@hulymcp/huly/operations/calendar.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const deleteEventAction = createAction({
  auth: hulyAuth,
  name: "delete_event",
  displayName: "Delete Event",
  description: "Delete a calendar event from Huly",
  props: {
    event_id: Property.ShortText({
      displayName: "Event ID",
      description: "ID of the event to delete",
      required: true,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      deleteEvent({ eventId: context.propsValue.event_id })
    );
    return { event_id: result.eventId, deleted: result.deleted };
  },
});
