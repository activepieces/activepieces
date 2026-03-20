import { createAction, Property } from "@activepieces/pieces-framework";
import { listEventInstances } from "@hulymcp/huly/operations/calendar-recurring.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listEventInstancesAction = createAction({
  auth: hulyAuth,
  name: "list_event_instances",
  displayName: "List Event Instances",
  description: "List instances (occurrences) of a recurring event",
  props: {
    recurring_event_id: Property.ShortText({
      displayName: "Recurring Event ID",
      description: "ID of the recurring event (from list_recurring_events output)",
      required: true,
    }),
  },
  async run(context) {
    const instances = await withHulyClient(
      context.auth,
      listEventInstances({
        recurringEventId: context.propsValue.recurring_event_id,
      })
    );
    return instances.map((i) => ({
      event_id: i.eventId,
      recurring_event_id: i.recurringEventId,
      title: i.title,
      date: i.date,
      due_date: i.dueDate,
      original_start_time: i.originalStartTime,
      all_day: i.allDay,
      location: i.location ?? null,
      is_cancelled: i.isCancelled ?? false,
    }));
  },
});
