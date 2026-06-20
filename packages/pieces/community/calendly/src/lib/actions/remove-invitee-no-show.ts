import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const removeInviteeNoShow = createAction({
  auth: calendlyAuth,
  name: "clear_no_show",
  displayName: "Remove Invitee No-Show",
  description: "Clear the no-show status from an invitee.",
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

    await calendlyCommon.apiRequest({
      token,
      method: HttpMethod.DELETE,
      path: `/invitees/${inviteeUuid}/no_show`
    });

    return { success: true };
  }
});
