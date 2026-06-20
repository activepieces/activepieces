import { HttpMethod } from "@activepieces/pieces-common";
import { createAction, Property } from "@activepieces/pieces-framework";
import { calendlyAuth } from '../auth';
import { calendlyCommon } from '../common';

export const createEventInvitee = createAction({
  auth: calendlyAuth,
  name: "create_event",
  displayName: "Create Event (Book Meeting)",
  description:
    "Book a new Calendly meeting via the Scheduling API. Requires a paid Calendly plan and a token with scheduled_events:write. Additional guests can only be added at booking time — Calendly does not support adding invitees to an existing event via API.",
  props: {
    event_type: calendlyCommon.eventTypeDropdown(),
    start_time: Property.DateTime({
      displayName: "Start Time",
      description:
        "Meeting start time in UTC. Use Get Available Times to find valid slots.",
      required: true
    }),
    invitee_name: Property.ShortText({
      displayName: "Invitee Name",
      required: true
    }),
    invitee_email: Property.ShortText({
      displayName: "Invitee Email",
      required: true
    }),
    invitee_timezone: Property.ShortText({
      displayName: "Invitee Timezone",
      description: 'IANA timezone, e.g. "America/New_York".',
      required: false
    }),
    event_guests: Property.LongText({
      displayName: "Additional Guests",
      description:
        "Comma-separated email addresses to add as event guests at booking time.",
      required: false
    }),
    location_kind: Property.StaticDropdown({
      displayName: "Location Kind",
      description:
        "Required for some event types. Leave empty if the event type already defines location.",
      required: false,
      options: {
        disabled: false,
        options: [
          { label: "Zoom", value: "zoom_conference" },
          { label: "Google Meet", value: "google_conference" },
          { label: "Microsoft Teams", value: "microsoft_teams_conference" },
          { label: "Outbound call", value: "outbound_call" },
          { label: "In-person / physical", value: "physical" },
          { label: "Custom", value: "custom" },
          { label: "Ask invitee", value: "ask_invitee" }
        ]
      }
    }),
    location_value: Property.ShortText({
      displayName: "Location Value",
      description:
        "Phone number for outbound_call, address for physical, or custom location text.",
      required: false
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const {
      event_type,
      start_time,
      invitee_name,
      invitee_email,
      invitee_timezone,
      event_guests,
      location_kind,
      location_value
    } = context.propsValue;

    const body: Record<string, unknown> = {
      event_type: calendlyCommon.resolveEventTypeUri(event_type),
      start_time: new Date(start_time as string).toISOString(),
      invitee: {
        name: invitee_name,
        email: invitee_email
      }
    };

    if (invitee_timezone && String(invitee_timezone).trim()) {
      (body.invitee as Record<string, string>).timezone = String(
        invitee_timezone
      ).trim();
    }

    if (event_guests && String(event_guests).trim()) {
      body.event_guests = String(event_guests)
        .split(",")
        .map(email => email.trim())
        .filter(Boolean);
    }

    if (location_kind) {
      const location: Record<string, string> = {
        kind: location_kind as string
      };
      if (location_value && String(location_value).trim()) {
        location.location = String(location_value).trim();
      }
      body.location = location;
    }

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.POST,
      path: "/invitees",
      body
    });
  }
});
