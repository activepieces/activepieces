import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const listRoutingForms = createAction({
  auth: calendlyAuth,
  name: "list_routing_forms",
  displayName: "List Routing Forms",
  description:
    "List routing forms for the organization. Requires Calendly Teams plan and routing_forms:read scope.",
  props: {
    count: Property.Number({
      displayName: "Count",
      required: false
    }),
    page_token: Property.ShortText({
      displayName: "Page Token",
      required: false
    }),
    sort: Property.ShortText({
      displayName: "Sort",
      description: 'e.g. "created_at:desc"',
      required: false
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const user = await calendlyCommon.getUser(token);

    const queryParams: Record<string, string> = {
      organization: user.current_organization
    };

    const { count, page_token, sort } = context.propsValue;

    if (count !== undefined && count !== null) {
      queryParams.count = String(count);
    }
    if (page_token && String(page_token).trim()) {
      queryParams.page_token = String(page_token).trim();
    }
    if (sort && String(sort).trim()) {
      queryParams.sort = String(sort).trim();
    }

    return calendlyCommon.apiRequest({
      token,
      method: HttpMethod.GET,
      path: "/routing_forms",
      queryParams
    });
  }
});
