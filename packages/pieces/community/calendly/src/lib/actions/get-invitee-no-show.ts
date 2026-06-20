import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const getInviteeNoShow = createAction({
  auth: calendlyAuth,
  name: "get_no_show",
  displayName: "Get Invitee No-Show",
  description: "Get no-show record details for an invitee.",
  props: {
    no_show_uuid: Property.ShortText({
      displayName: "No-Show UUID or URI",
      required: true
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const noShowUuid = calendlyCommon.resolveUuid(
      context.propsValue.no_show_uuid
    );

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.GET,
      path: `/invitee_no_shows/${noShowUuid}`
    });
  }
});
