import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const listEventInvitees = createAction({
  auth: calendlyAuth,
  name: "list_invitees",
  displayName: "List Event Invitees",
  description: "List invitees for a scheduled Calendly event.",
  props: {
    event_uuid: Property.ShortText({
      displayName: "Event UUID or URI",
      description:
        "The scheduled event UUID or full Calendly URI (not an invitee URI).",
      required: true
    }),
    status: Property.StaticDropdown({
      displayName: "Status",
      required: false,
      options: {
        disabled: false,
        options: [
          { label: "Active", value: "active" },
          { label: "Canceled", value: "canceled" }
        ]
      }
    }),
    count: Property.Number({
      displayName: "Count",
      description: "Number of rows to return (max 100).",
      required: false
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const eventUuid = calendlyCommon.resolveUuid(context.propsValue.event_uuid);

    const queryParams: Record<string, string> = {};
    const { status, count } = context.propsValue;

    if (status) {
      queryParams.status = status as string;
    }
    if (count !== undefined && count !== null) {
      queryParams.count = String(count);
    }

    return calendlyCommon.apiRequest<{ collection: unknown[] }>({
      token,
      method: HttpMethod.GET,
      path: `/scheduled_events/${eventUuid}/invitees`,
      queryParams
    });
  }
});
