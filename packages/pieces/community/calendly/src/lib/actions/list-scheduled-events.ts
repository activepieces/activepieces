import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const listScheduledEvents = createAction({
  auth: calendlyAuth,
  name: "list_events",
  displayName: "List Scheduled Events",
  description: "List scheduled Calendly events for the connected account.",
  props: {
    list_scope: calendlyCommon.listScopeDropdown(),
    invitee_email: Property.ShortText({
      displayName: "Invitee Email",
      description: "Only return events booked by this email address.",
      required: false
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
    min_start_time: Property.DateTime({
      displayName: "Min Start Time",
      description: "Only include events starting after this time.",
      required: false
    }),
    max_start_time: Property.DateTime({
      displayName: "Max Start Time",
      description: "Only include events starting before this time.",
      required: false
    }),
    count: Property.Number({
      displayName: "Count",
      description: "Number of rows to return (max 100).",
      required: false
    }),
    sort: Property.StaticDropdown({
      displayName: "Sort",
      required: false,
      options: {
        disabled: false,
        options: [
          { label: "Start time ascending", value: "start_time:asc" },
          { label: "Start time descending", value: "start_time:desc" },
          { label: "Created at ascending", value: "created_at:asc" },
          { label: "Created at descending", value: "created_at:desc" },
          { label: "Updated at ascending", value: "updated_at:asc" },
          { label: "Updated at descending", value: "updated_at:desc" }
        ]
      }
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const user = await calendlyCommon.getUser(token);

    const listScope = (context.propsValue.list_scope as string) || "user";
    const queryParams: Record<string, string> =
      listScope === "organization"
        ? { organization: user.current_organization }
        : { user: user.uri };

    const {
      invitee_email,
      status,
      min_start_time,
      max_start_time,
      count,
      sort
    } = context.propsValue;

    if (invitee_email && String(invitee_email).trim()) {
      queryParams.invitee_email = String(invitee_email).trim();
    }

    if (status) {
      queryParams.status = status as string;
    }
    if (min_start_time) {
      queryParams.min_start_time = new Date(
        min_start_time as string
      ).toISOString();
    }
    if (max_start_time) {
      queryParams.max_start_time = new Date(
        max_start_time as string
      ).toISOString();
    }
    if (count !== undefined && count !== null) {
      queryParams.count = String(count);
    }
    if (sort) {
      queryParams.sort = sort as string;
    }

    return calendlyCommon.apiRequest<{ collection: unknown[] }>({
      token,
      method: HttpMethod.GET,
      path: "/scheduled_events",
      queryParams
    });
  }
});
