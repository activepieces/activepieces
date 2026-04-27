import { createAction, Property } from "@activepieces/pieces-framework";
import { getEvent } from "@hulymcp/huly/operations/calendar.js";
import { hulyAuth } from "../auth";
import { withHulyClient } from "../common/client";

export const getEventAction = createAction({
  auth: hulyAuth,
  name: "get_event",
  displayName: "Get Event",
  description: "Get full details of a calendar event",
  props: {
    event_id: Property.ShortText({
      displayName: "Event ID",
      description: "ID of the event (from list_events output)",
      required: true,
    }),
  },
  async run(context) {
    const e = await withHulyClient(
      context.auth,
      getEvent({ eventId: context.propsValue.event_id })
    );
    return {
      event_id: e.eventId,
      title: e.title,
      description: e.description ?? null,
      date: e.date,
      due_date: e.dueDate,
      all_day: e.allDay,
      location: e.location ?? null,
      visibility: e.visibility ?? null,
      participants: (e.participants ?? [])
        .map((p) => p.name ?? p.email ?? p.id)
        .join(", "),
      external_participants: (e.externalParticipants ?? []).join(", "),
      modified_on: e.modifiedOn ?? null,
      created_on: e.createdOn ?? null,
    };
  },
});
