import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { gmailMcpAuth } from "../../index";

export const searchEmailsTool = createAction({
  auth: gmailMcpAuth,
  name: "search_emails",
  displayName: "Search Emails (MCP)",
  description: "Search for emails in Gmail using a query string",
  props: {
    query: Property.ShortText({
      displayName: "Query",
      description: "Google search query (e.g., 'from:someone@example.com')",
      required: true,
    }),
    max_results: Property.Number({
      displayName: "Max Results",
      description: "Maximum number of results to return",
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const { query, max_results } = context.propsValue;
    const { access_token } = context.auth;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: "https://gmail.googleapis.com/gmail/v1/users/me/messages",
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      queryParams: {
        q: query,
        maxResults: max_results?.toString() || "10",
      },
    });

    return response.body;
  },
});
