import { createAction } from "@activepieces/pieces-framework";
import { listEvents } from "@hulymcp/huly/operations/calendar.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listEventsAction = createAction({
  auth: hulyAuth,
  name: "list_events",
  displayName: "List Events",
  description: "List calendar events in your Huly workspace",
  props: {},
  async run(context) {
    const events = await withHulyClient(context.auth, listEvents({}));
    return events.map((e) => ({
      event_id: e.eventId,
      title: e.title,
      date: e.date,
      due_date: e.dueDate,
      all_day: e.allDay,
      location: e.location ?? null,
      modified_on: e.modifiedOn ?? null,
    }));
  },
});
