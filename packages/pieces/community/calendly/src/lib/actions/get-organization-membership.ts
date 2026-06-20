import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const getOrganizationMembership = createAction({
  auth: calendlyAuth,
  name: "get_team_member",
  displayName: "Get Organization Membership",
  description: "Get details for a specific organization membership.",
  props: {
    membership_uuid: Property.ShortText({
      displayName: "Membership UUID or URI",
      required: true
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const membershipUuid = calendlyCommon.resolveUuid(
      context.propsValue.membership_uuid
    );

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.GET,
      path: `/organization_memberships/${membershipUuid}`
    });
  }
});
