import { createAction, Property } from "@activepieces/pieces-framework";
import { updateEvent } from "@hulymcp/huly/operations/calendar.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const updateEventAction = createAction({
  auth: hulyAuth,
  name: "update_event",
  displayName: "Update Event",
  description: "Update a calendar event in Huly",
  props: {
    event_id: Property.ShortText({
      displayName: "Event ID",
      description: "ID of the event to update",
      required: true,
    }),
    title: Property.ShortText({
      displayName: "New Title",
      description: "New event title (leave empty to keep current)",
      required: false,
    }),
    date: Property.DateTime({
      displayName: "New Start Date",
      description: "New start date/time (leave empty to keep current)",
      required: false,
    }),
    due_date: Property.DateTime({
      displayName: "New End Date",
      description: "New end date/time (leave empty to keep current)",
      required: false,
    }),
    description: Property.LongText({
      displayName: "New Description",
      description: "New event description (leave empty to keep current)",
      required: false,
    }),
    location: Property.ShortText({
      displayName: "New Location",
      description: "New event location (leave empty to keep current)",
      required: false,
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      updateEvent({
        eventId: context.propsValue.event_id,
        title: context.propsValue.title || undefined,
        date: context.propsValue.date
          ? new Date(context.propsValue.date).getTime()
          : undefined,
        dueDate: context.propsValue.due_date
          ? new Date(context.propsValue.due_date).getTime()
          : undefined,
        description: context.propsValue.description || undefined,
        location: context.propsValue.location || undefined,
      })
    );
    return { event_id: result.eventId, updated: result.updated };
  },
});
