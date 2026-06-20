import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const getEventInvitee = createAction({
  auth: calendlyAuth,
  name: "get_invitee",
  displayName: "Get Event Invitee",
  description: "Get a single invitee on a scheduled Calendly event.",
  props: {
    event_uuid: Property.ShortText({
      displayName: "Event UUID or URI",
      description: "The scheduled event UUID or full Calendly URI.",
      required: true
    }),
    invitee_uuid: Property.ShortText({
      displayName: "Invitee UUID or URI",
      description:
        "The invitee UUID or full invitee URI from a trigger payload or list action.",
      required: true
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const eventUuid = calendlyCommon.resolveUuid(context.propsValue.event_uuid);
    const inviteeUuid = calendlyCommon.resolveUuid(
      context.propsValue.invitee_uuid
    );

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.GET,
      path: `/scheduled_events/${eventUuid}/invitees/${inviteeUuid}`
    });
  }
});
