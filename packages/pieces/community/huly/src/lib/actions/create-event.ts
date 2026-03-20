import { createAction, Property } from "@activepieces/pieces-framework";
import { createEvent } from "@hulymcp/huly/operations/calendar.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const createEventAction = createAction({
  auth: hulyAuth,
  name: "create_event",
  displayName: "Create Event",
  description: "Create a calendar event in Huly",
  props: {
    title: Property.ShortText({
      displayName: "Title",
      description: "Event title",
      required: true,
    }),
    date: Property.DateTime({
      displayName: "Start Date",
      description: "Event start date/time",
      required: true,
    }),
    due_date: Property.DateTime({
      displayName: "End Date",
      description: "Event end date/time (defaults to start + 1 hour)",
      required: false,
    }),
    description: Property.LongText({
      displayName: "Description",
      description: "Event description",
      required: false,
    }),
    location: Property.ShortText({
      displayName: "Location",
      description: "Event location",
      required: false,
    }),
    all_day: Property.Checkbox({
      displayName: "All Day",
      description: "Whether this is an all-day event",
      required: false,
      defaultValue: false,
    }),
    visibility: Property.StaticDropdown<string, false>({
      displayName: "Visibility",
      description: "Event visibility",
      required: false,
      options: {
        options: [
          { label: "Public", value: "public" },
          { label: "Free/Busy", value: "freeBusy" },
          { label: "Private", value: "private" },
        ],
      },
    }),
  },
  async run(context) {
    const result = await withHulyClient(
      context.auth,
      createEvent({
        title: context.propsValue.title,
        date: new Date(context.propsValue.date).getTime(),
        dueDate: context.propsValue.due_date
          ? new Date(context.propsValue.due_date).getTime()
          : undefined,
        description: context.propsValue.description || undefined,
        location: context.propsValue.location || undefined,
        allDay: context.propsValue.all_day ?? false,
        visibility: context.propsValue.visibility || undefined,
      })
    );
    return { event_id: result.eventId };
  },
});
