import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const listRoutingFormSubmissions = createAction({
  auth: calendlyAuth,
  name: "list_form_submissions",
  displayName: "List Routing Form Submissions",
  description:
    "List submissions for a routing form. Requires Calendly Teams plan.",
  props: {
    form: Property.ShortText({
      displayName: "Routing Form URI",
      description:
        "Full routing form URI from List Routing Forms (e.g. https://api.calendly.com/routing_forms/...).",
      required: true
    }),
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
    const form = String(context.propsValue.form).trim();

    const queryParams: Record<string, string> = { form };

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
      path: "/routing_form_submissions",
      queryParams
    });
  }
});
