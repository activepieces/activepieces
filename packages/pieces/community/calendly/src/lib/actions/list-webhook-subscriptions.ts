import { createAction, Property } from "@activepieces/pieces-framework";
import { HttpMethod } from "@activepieces/pieces-common";
import { calendlyCommon } from '../common';
import { calendlyAuth } from '../auth';

export const listWebhookSubscriptions = createAction({
  auth: calendlyAuth,
  name: "list_webhooks",
  displayName: "List Webhook Subscriptions",
  description:
    "List Calendly webhook subscriptions. Useful for debugging webhook triggers.",
  props: {
    scope: calendlyCommon.scope,
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
      required: false
    })
  },
  async run(context) {
    const token = calendlyCommon.getToken(context.auth);
    const user = await calendlyCommon.getUser(token);
    const scope = (context.propsValue.scope as string) || "user";

    const queryParams: Record<string, string> = { scope };

    if (scope === "organization") {
      queryParams.organization = user.current_organization;
    } else {
      queryParams.user = user.uri;
    }

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
      path: "/webhook_subscriptions",
      queryParams
    });
  }
});
