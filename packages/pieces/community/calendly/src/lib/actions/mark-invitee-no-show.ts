import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const markInviteeNoShow = createAction({
  auth: calendlyAuth,
  name: "mark_no_show",
  displayName: "Mark Invitee No-Show",
  description: "Mark an invitee as a no-show for a scheduled event.",
  props: {
    invitee_uuid: Property.ShortText({
      displayName: "Invitee UUID or URI",
      required: true
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const inviteeUuid = calendlyCommon.resolveUuid(
      context.propsValue.invitee_uuid
    );

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.POST,
      path: `/invitees/${inviteeUuid}/no_show`,
      body: {}
    });
  }
});
