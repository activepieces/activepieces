import { createAction, Property } from "@activepieces/pieces-framework";
import { createRecurringEvent } from "@hulymcp/huly/operations/calendar-recurring.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const createRecurringEventAction = createAction({
  auth: hulyAuth,
  name: "create_recurring_event",
  displayName: "Create Recurring Event",
  description: "Create a recurring calendar event in Huly",
  props: {
    title: Property.ShortText({
      displayName: "Title",
      description: "Event title",
      required: true,
    }),
    start_date: Property.DateTime({
      displayName: "First Occurrence Start",
      description: "Start date/time of the first occurrence",
      required: true,
    }),
    due_date: Property.DateTime({
      displayName: "First Occurrence End",
      description: "End date/time of the first occurrence (defaults to start + 1 hour)",
      required: false,
    }),
    frequency: Property.StaticDropdown<string, true>({
      displayName: "Frequency",
      description: "How often the event repeats",
      required: true,
      options: {
        options: [
          { label: "Daily", value: "DAILY" },
          { label: "Weekly", value: "WEEKLY" },
          { label: "Monthly", value: "MONTHLY" },
          { label: "Yearly", value: "YEARLY" },
        ],
      },
    }),
    interval: Property.Number({
      displayName: "Interval",
      description: "Interval between occurrences (e.g., 2 = every 2 weeks)",
      required: false,
      defaultValue: 1,
    }),
    count: Property.Number({
      displayName: "Number of Occurrences",
      description: "Total number of occurrences (leave empty for no limit)",
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
    time_zone: Property.ShortText({
      displayName: "Time Zone",
      description: "Time zone (e.g., America/New_York)",
      required: false,
    }),
  },
  async run(context) {
    const rule: { freq: string; interval?: number; count?: number } = {
      freq: context.propsValue.frequency,
    };
    if (context.propsValue.interval && context.propsValue.interval > 1) {
      rule.interval = context.propsValue.interval;
    }
    if (context.propsValue.count) {
      rule.count = context.propsValue.count;
    }

    const result = await withHulyClient(
      context.auth,
      createRecurringEvent({
        title: context.propsValue.title,
        startDate: new Date(context.propsValue.start_date).getTime(),
        dueDate: context.propsValue.due_date
          ? new Date(context.propsValue.due_date).getTime()
          : undefined,
        rules: [rule],
        description: context.propsValue.description || undefined,
        location: context.propsValue.location || undefined,
        timeZone: context.propsValue.time_zone || undefined,
      })
    );
    return { event_id: result.eventId };
  },
});
