import { createAction, Property } from "@activepieces/pieces-framework";
import { httpClient, HttpMethod } from "@activepieces/pieces-common";
import { braveSearchAuth } from "../../index";

export const braveWebSearchAction = createAction({
  auth: braveSearchAuth,
  name: "web_search",
  displayName: "Web Search",
  description: "Search the web using Brave Search",
  props: {
    query: Property.ShortText({
      displayName: "Query",
      description: "The search query",
      required: true,
    }),
    count: Property.Number({
      displayName: "Count",
      description: "Number of results (1-20)",
      required: false,
      defaultValue: 10,
    }),
  },
  async run(context) {
    const apiKey = context.auth as string; // Standard SecretText behavior in newer versions usually implies string, but let's check.
    // In Activepieces, SecretText can be string or object depending on version. 
    // Based on 'airtable' and 'openai', it seems to be an object with .secret_text?
    // But let's handle both just in case.
    
    // Actually, looking at the type definition for SecretText from a distance, 
    // if I cast it to any, I can be safe.
    const token = (typeof apiKey === 'string') ? apiKey : (apiKey as any).secret_text || (apiKey as any).auth;

    const query = context.propsValue.query;
    const count = context.propsValue.count || 10;

    const response = await httpClient.sendRequest({
      method: HttpMethod.GET,
      url: "https://api.search.brave.com/res/v1/web/search",
      headers: {
        "X-Subscription-Token": token,
        "Accept": "application/json",
      },
      queryParams: {
        q: query,
        count: count.toString(),
      },
    });

    return response.body;
  },
});
