import { createAction } from "@activepieces/pieces-framework";
import { listRecurringEvents } from "@hulymcp/huly/operations/calendar-recurring.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const listRecurringEventsAction = createAction({
  auth: hulyAuth,
  name: "list_recurring_events",
  displayName: "List Recurring Events",
  description: "List recurring calendar events in Huly",
  props: {},
  async run(context) {
    const events = await withHulyClient(
      context.auth,
      listRecurringEvents({})
    );
    return events.map((e) => ({
      event_id: e.eventId,
      title: e.title,
      original_start_time: e.originalStartTime,
      rules: JSON.stringify(e.rules),
      time_zone: e.timeZone ?? null,
      modified_on: e.modifiedOn ?? null,
    }));
  },
});
