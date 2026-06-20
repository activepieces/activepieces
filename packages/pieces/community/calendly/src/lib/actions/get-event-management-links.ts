import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

type InviteeResource = {
  resource: {
    cancel_url?: string;
    reschedule_url?: string;
    uri?: string;
    email?: string;
    name?: string;
    status?: string;
    event?: string;
  };
};

export const getEventManagementLinks = createAction({
  auth: calendlyAuth,
  name: "get_management_links",
  displayName: "Get Event Management Links",
  description:
    "Get cancel and reschedule URLs for an invitee. Calendly has no API to directly reschedule or edit a booked event — use these links or cancel and rebook.",
  props: {
    event_uuid: Property.ShortText({
      displayName: "Event UUID or URI",
      required: true
    }),
    invitee_uuid: Property.ShortText({
      displayName: "Invitee UUID or URI",
      required: true
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const eventUuid = calendlyCommon.resolveUuid(context.propsValue.event_uuid);
    const inviteeUuid = calendlyCommon.resolveUuid(
      context.propsValue.invitee_uuid
    );

    const response = await calendlyCommon.apiRequest<InviteeResource>({
      token,
      method: HttpMethod.GET,
      path: `/scheduled_events/${eventUuid}/invitees/${inviteeUuid}`
    });

    const invitee = response.resource;

    return {
      invitee_uri: invitee.uri,
      event_uri: invitee.event,
      email: invitee.email,
      name: invitee.name,
      status: invitee.status,
      cancel_url: invitee.cancel_url,
      reschedule_url: invitee.reschedule_url,
      note:
        "Calendly does not expose a reschedule API. Send the invitee reschedule_url or cancel and create a new booking."
    };
  }
});
