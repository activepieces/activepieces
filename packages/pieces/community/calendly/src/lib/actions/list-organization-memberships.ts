import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const listOrganizationMemberships = createAction({
  auth: calendlyAuth,
  name: "list_team_members",
  displayName: "List Organization Members",
  description: "List members in the connected user's Calendly organization.",
  props: {
    email: Property.ShortText({
      displayName: "Filter by Email",
      required: false
    }),
    count: Property.Number({
      displayName: "Count",
      required: false
    }),
    page_token: Property.ShortText({
      displayName: "Page Token",
      required: false
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const user = await calendlyCommon.getUser(token);

    const queryParams: Record<string, string> = {
      organization: user.current_organization
    };

    const { email, count, page_token } = context.propsValue;

    if (email && String(email).trim()) {
      queryParams.email = String(email).trim();
    }
    if (count !== undefined && count !== null) {
      queryParams.count = String(count);
    }
    if (page_token && String(page_token).trim()) {
      queryParams.page_token = String(page_token).trim();
    }

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.GET,
      path: "/organization_memberships",
      queryParams
    });
  }
});
